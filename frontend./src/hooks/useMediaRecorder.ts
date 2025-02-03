import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export const useMediaRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      return new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        recorder.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
            const formData = new FormData();
            formData.append('audio_file', blob, 'voice-message.ogg');
            
            const { data } = await api.post('/chat/voice', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            resolve(data);
          } catch (error) {
            reject(error);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      });
    } catch (error) {
      toast.error('Failed to start recording');
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};