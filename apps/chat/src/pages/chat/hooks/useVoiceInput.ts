import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceInputState {
  /** 浏览器是否支持 Web Speech API */
  supported: boolean;
  /** 是否正在录音 */
  recording: boolean;
  /** 临时识别文本（interim result） */
  interimText: string;
  /** 最终识别文本 */
  finalText: string;
  /** 错误消息 */
  error: string | null;
}

export interface VoiceInputActions {
  startListening: () => void;
  /** 停止录音并等待识别结果返回，resolve 值为最终识别的文字 */
  stopListening: () => Promise<string>;
  abortListening: () => void;
}

/**
 * useVoiceInput — 封装 Web Speech API（SpeechRecognition）
 *
 * 纯前端语音转文字，无需后端端点。
 *
 * - PC: 点击切换录音（start/stop）
 * - 移动端: 按住录音（start/abort）
 * - 不支持时 supported = false，调用方隐藏语音按钮
 */
export function useVoiceInput(): VoiceInputState & VoiceInputActions {
  const [supported] = useState(() => {
    return !!(
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    );
  });

  const [recording, setRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const finalTranscriptRef = useRef('');
  const isAbortedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setError('浏览器不支持语音识别');
      return;
    }

    const SpeechRecognitionAPI =
      (window as unknown as Record<string, unknown>).SpeechRecognition as typeof SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition as typeof SpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('浏览器不支持语音识别');
      return;
    }

    cleanup();
    finalTranscriptRef.current = '';
    isAbortedRef.current = false;
    setError(null);
    setInterimText('');
    setFinalText('');

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setFinalText(finalTranscriptRef.current);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (isAbortedRef.current) return;
      let msg: string;
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          msg = '麦克风权限被拒绝';
          break;
        case 'no-speech':
          msg = '未检测到语音';
          break;
        case 'audio-capture':
          msg = '未找到麦克风';
          break;
        case 'network':
          msg = '网络错误';
          break;
        case 'aborted':
          return;
        default:
          msg = `语音识别错误: ${event.error}`;
      }
      setError(msg);
      setRecording(false);
    };

    recognition.onend = () => {
      if (!isAbortedRef.current) {
        // Only set recording false if we weren't aborted
        setRecording(false);
        // If we got some transcription and ended naturally, finalize
        if (finalTranscriptRef.current) {
          setInterimText('');
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
    } catch (err) {
      setError('启动语音识别失败');
      setRecording(false);
    }
  }, [supported, cleanup]);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise<string>((resolve) => {
      if (recognitionRef.current) {
        const recognition = recognitionRef.current;
        const origOnEnd = recognition.onend;
        // 替换 onend 以捕获最终转录结果
        recognition.onend = (e: Event) => {
          if (origOnEnd) {
            (origOnEnd as (e: Event) => void).call(recognition, e);
          }
          // onend 触发时 onresult 一定已经触发完毕，finalTranscriptRef 已更新
          resolve(finalTranscriptRef.current);
        };
        try {
          recognition.stop();
        } catch {
          resolve(finalTranscriptRef.current);
        }
      } else {
        resolve(finalTranscriptRef.current);
      }
      setRecording(false);
    });
  }, []);

  const abortListening = useCallback(() => {
    isAbortedRef.current = true;
    cleanup();
    setRecording(false);
    // Don't clear finalText — caller might still use what we got
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    supported,
    recording,
    interimText,
    finalText,
    error,
    startListening,
    stopListening,
    abortListening,
  };
}
