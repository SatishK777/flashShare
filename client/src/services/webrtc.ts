import { getSocket } from './socket';

const CHUNK_SIZE = 16 * 1024; // 16KB chunks for DataChannel

export interface P2PTransferProgress {
  fileIndex: number;
  totalFiles: number;
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
  speed: number;
  status: 'connecting' | 'transferring' | 'completed' | 'failed';
}

export class WebRTCTransfer {
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private socket = getSocket();
  private roomId: string;
  private role: 'sender' | 'receiver';
  
  private filesToSend: File[] = [];
  private receivedChunks: ArrayBuffer[] = [];
  private receivedFiles: { name: string; data: Blob; mimeType: string }[] = [];
  private currentFileMetadata: { name: string; size: number; mimeType: string; totalChunks: number } | null = null;
  
  private startTime = 0;
  private bytesTransferred = 0;
  private fileIndex = 0;

  onProgress?: (progress: P2PTransferProgress) => void;
  onComplete?: (files: { name: string; data: Blob; mimeType: string }[]) => void;
  onError?: (error: Error) => void;
  onPeerConnected?: () => void;
  
  constructor(roomId: string, role: 'sender' | 'receiver') {
    this.roomId = roomId;
    this.role = role;
  }
  
  async init(): Promise<void> {
    try {
      const response = await fetch('/api/config/ice-servers');
      const iceServers = response.ok ? await response.json() : [{ urls: 'stun:stun.l.google.com:19302' }];
      
      this.pc = new RTCPeerConnection({ iceServers });
      
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc_ice_candidate', { roomId: this.roomId, candidate: event.candidate });
        }
      };

      this.pc.onconnectionstatechange = () => {
        if (this.pc?.connectionState === 'connected') {
          this.onPeerConnected?.();
        } else if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
          this.onError?.(new Error('WebRTC Connection Failed'));
        }
      };

      if (this.role === 'sender') {
        this.dataChannel = this.pc.createDataChannel('fileTransfer', { ordered: true });
        this.setupDataChannel();
      } else {
        this.pc.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannel();
        };
      }
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error('WebRTC init failed'));
    }
  }

  private setupDataChannel() {
    if (!this.dataChannel) return;
    this.dataChannel.binaryType = 'arraybuffer';
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      if (this.role === 'sender' && this.filesToSend.length > 0) {
        this.startSendingFiles();
      }
    };
    
    this.dataChannel.onmessage = (event) => {
      this.handleReceivedData(event.data);
    };

    this.dataChannel.onerror = (error) => {
      this.onError?.(new Error('DataChannel error: ' + error));
    };
  }

  async createOffer(): Promise<void> {
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket.emit('webrtc_offer', { roomId: this.roomId, offer });
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.socket.emit('webrtc_answer', { roomId: this.roomId, answer });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async sendFiles(files: File[]): Promise<void> {
    this.filesToSend = files;
    if (this.dataChannel?.readyState === 'open') {
      this.startSendingFiles();
    }
  }

  private async startSendingFiles() {
    this.startTime = Date.now();
    for (let i = 0; i < this.filesToSend.length; i++) {
      this.fileIndex = i;
      const file = this.filesToSend[i];
      await this.sendFile(file);
    }
    this.dataChannel?.send(JSON.stringify({ type: 'transfer_complete' }));
  }

  private async sendFile(file: File): Promise<void> {
    if (!this.dataChannel) return;
    
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const meta = {
      type: 'file_meta',
      name: file.name,
      size: file.size,
      mimeType: file.type,
      totalChunks
    };
    
    this.dataChannel.send(JSON.stringify(meta));
    
    let offset = 0;
    this.bytesTransferred = 0;
    this.startTime = Date.now();

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await chunk.arrayBuffer();
      
      while (this.dataChannel.bufferedAmount > this.dataChannel.bufferedAmountLowThreshold) {
        await new Promise(resolve => {
          this.dataChannel!.onbufferedamountlow = () => {
            this.dataChannel!.onbufferedamountlow = null;
            resolve(null);
          };
        });
      }
      
      this.dataChannel.send(buffer);
      offset += buffer.byteLength;
      this.bytesTransferred += buffer.byteLength;
      
      const speed = this.bytesTransferred / ((Date.now() - this.startTime) / 1000);
      
      this.onProgress?.({
        fileIndex: this.fileIndex,
        totalFiles: this.filesToSend.length,
        fileName: file.name,
        bytesTransferred: this.bytesTransferred,
        totalBytes: file.size,
        speed,
        status: 'transferring'
      });
    }
    
    this.dataChannel.send(JSON.stringify({ type: 'file_complete' }));
  }

  private handleReceivedData(data: ArrayBuffer | string): void {
    if (typeof data === 'string') {
      const msg = JSON.parse(data);
      if (msg.type === 'file_meta') {
        this.currentFileMetadata = msg;
        this.receivedChunks = [];
        this.bytesTransferred = 0;
        this.startTime = Date.now();
      } else if (msg.type === 'file_complete') {
        if (this.currentFileMetadata) {
          const blob = new Blob(this.receivedChunks, { type: this.currentFileMetadata.mimeType });
          this.receivedFiles.push({
            name: this.currentFileMetadata.name,
            data: blob,
            mimeType: this.currentFileMetadata.mimeType
          });
        }
        this.currentFileMetadata = null;
        this.fileIndex++;
      } else if (msg.type === 'transfer_complete') {
        this.onComplete?.(this.receivedFiles);
      }
    } else {
      this.receivedChunks.push(data);
      this.bytesTransferred += data.byteLength;
      
      if (this.currentFileMetadata) {
        const speed = this.bytesTransferred / ((Date.now() - this.startTime) / 1000);
        this.onProgress?.({
          fileIndex: this.fileIndex,
          totalFiles: 0, // Receiver might not know total files upfront without extra protocol messaging
          fileName: this.currentFileMetadata.name,
          bytesTransferred: this.bytesTransferred,
          totalBytes: this.currentFileMetadata.size,
          speed,
          status: 'transferring'
        });
      }
    }
  }

  destroy(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.pc) {
      this.pc.close();
    }
    this.socket.off('webrtc_offer');
    this.socket.off('webrtc_answer');
    this.socket.off('webrtc_ice_candidate');
  }
}

export function isWebRTCSupported(): boolean {
  return !!(window.RTCPeerConnection && window.RTCSessionDescription);
}
