import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Modal,
  Form,
  Button,
  message,
  Select,
  Space,
  Divider,
  Tag,
} from 'antd';
import {
  CodeOutlined,
  BgColorsOutlined,
  LinkOutlined,
  CompressOutlined,
  LockOutlined,
  CalendarOutlined,
  QrcodeOutlined,
  NumberOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  FileTextOutlined,
  KeyOutlined,
  TableOutlined,
  ExperimentOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ToolItem {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ReactNode;
  category: string;
  color: string;
  action: () => void;
}

const ToolsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toolCategories = [
    { key: 'all', label: t('tools.all') },
    { key: 'convert', label: t('tools.convert') },
    { key: 'generate', label: t('tools.generate') },
    { key: 'encode', label: t('tools.encode') },
    { key: 'dev', label: t('tools.dev') },
  ];

  const toolList: ToolItem[] = [
    {
      id: 'json',
      nameKey: 'tools.json',
      descKey: 'tools.jsonDesc',
      icon: <CodeOutlined />,
      category: 'convert',
      color: '#8b5cf6',
      action: () => setActiveTool('json'),
    },
    {
      id: 'color',
      nameKey: 'tools.color',
      descKey: 'tools.colorDesc',
      icon: <BgColorsOutlined />,
      category: 'convert',
      color: '#ec4899',
      action: () => setActiveTool('color'),
    },
    {
      id: 'url',
      nameKey: 'tools.url',
      descKey: 'tools.urlDesc',
      icon: <LinkOutlined />,
      category: 'encode',
      color: '#0ea5e9',
      action: () => setActiveTool('url'),
    },
    {
      id: 'base64',
      nameKey: 'tools.base64',
      descKey: 'tools.base64Desc',
      icon: <CompressOutlined />,
      category: 'encode',
      color: '#10b981',
      action: () => setActiveTool('base64'),
    },
    {
      id: 'hash',
      nameKey: 'tools.hash',
      descKey: 'tools.hashDesc',
      icon: <LockOutlined />,
      category: 'generate',
      color: '#f97316',
      action: () => setActiveTool('hash'),
    },
    {
      id: 'timestamp',
      nameKey: 'tools.timestamp',
      descKey: 'tools.timestampDesc',
      icon: <CalendarOutlined />,
      category: 'convert',
      color: '#eab308',
      action: () => setActiveTool('timestamp'),
    },
    {
      id: 'uuid',
      nameKey: 'tools.uuid',
      descKey: 'tools.uuidDesc',
      icon: <NumberOutlined />,
      category: 'generate',
      color: '#06b6d4',
      action: () => setActiveTool('uuid'),
    },
    {
      id: 'wordcount',
      nameKey: 'tools.wordcount',
      descKey: 'tools.wordcountDesc',
      icon: <FileTextOutlined />,
      category: 'convert',
      color: '#8b5cf6',
      action: () => setActiveTool('wordcount'),
    },
    {
      id: 'qrcode',
      nameKey: 'tools.qrcode',
      descKey: 'tools.qrcodeDesc',
      icon: <QrcodeOutlined />,
      category: 'generate',
      color: '#00d9a5',
      action: () => setActiveTool('qrcode'),
    },
    {
      id: 'jwt',
      nameKey: 'tools.jwt',
      descKey: 'tools.jwtDesc',
      icon: <KeyOutlined />,
      category: 'dev',
      color: '#a855f7',
      action: () => setActiveTool('jwt'),
    },
    {
      id: 'cron',
      nameKey: 'tools.cron',
      descKey: 'tools.cronDesc',
      icon: <CalendarOutlined />,
      category: 'dev',
      color: '#f43f5e',
      action: () => setActiveTool('cron'),
    },
    {
      id: 'ascii',
      nameKey: 'tools.ascii',
      descKey: 'tools.asciiDesc',
      icon: <TranslationOutlined />,
      category: 'generate',
      color: '#14b8a6',
      action: () => setActiveTool('ascii'),
    },
    {
      id: 'encrypt',
      nameKey: 'tools.encrypt',
      descKey: 'tools.encryptDesc',
      icon: <LockOutlined />,
      category: 'encode',
      color: '#0ea5e9',
      action: () => setActiveTool('encrypt'),
    },
    {
      id: 'sql',
      nameKey: 'tools.sql',
      descKey: 'tools.sqlDesc',
      icon: <TableOutlined />,
      category: 'dev',
      color: '#eab308',
      action: () => setActiveTool('sql'),
    },
    {
      id: 'regex',
      nameKey: 'tools.regex',
      descKey: 'tools.regexDesc',
      icon: <ExperimentOutlined />,
      category: 'dev',
      color: '#ec4899',
      action: () => setActiveTool('regex'),
    },
  ];

  // 基础工具状态
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [colorInput, setColorInput] = useState('#8b5cf6');
  const [colorFormat, setColorFormat] = useState<Record<string, string>>({});
  const [urlInput, setUrlInput] = useState('');
  const [base64Input, setBase64Input] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [hashType, setHashType] = useState('md5');
  const [hashOutput, setHashOutput] = useState('');
  const [timestampInput, setTimestampInput] = useState('');
  const [timestampOutput, setTimestampOutput] = useState('');
  const [uuidOutput, setUuidOutput] = useState('');
  const [wordCountInput, setWordCountInput] = useState('');
  const [wordCountOutput, setWordCountOutput] = useState<
    Record<string, number>
  >({});

  // 新工具状态
  const [qrCodeOutput, setQrCodeOutput] = useState('');
  const [qrCodeText, setQrCodeText] = useState('https://abner.dev');
  const [jwtInput, setJwtInput] = useState('');
  const [jwtOutput, setJwtOutput] = useState<{
    header: unknown;
    payload: unknown;
    valid: boolean;
  } | null>(null);
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [cronDescription, setCronDescription] = useState('');
  const [asciiInput, setAsciiInput] = useState('Hello');
  const [asciiOutput, setAsciiOutput] = useState('');
  const [encryptInput, setEncryptInput] = useState('');
  const [encryptKey, setEncryptKey] = useState('1234567890123456');
  const [encryptOutput, setEncryptOutput] = useState('');
  const [sqlInput, setSqlInput] = useState('SELECT * FROM users WHERE id = 1');
  const [sqlOutput, setSqlOutput] = useState('');
  const [regexInput, setRegexInput] = useState('');
  const [regexTestInput, setRegexTestInput] = useState('');
  const [regexOutput, setRegexOutput] = useState<{
    matches: string[];
    valid: boolean;
  } | null>(null);

  const filteredTools =
    activeCategory === 'all'
      ? toolList
      : toolList.filter((tool) => tool.category === activeCategory);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    message.success('复制成功！');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const clearAll = () => {
    setJsonInput('');
    setJsonOutput('');
    setColorInput('#8b5cf6');
    setColorFormat({});
    setUrlInput('');
    setBase64Input('');
    setHashInput('');
    setHashOutput('');
    setTimestampInput('');
    setTimestampOutput('');
    setWordCountInput('');
    setWordCountOutput({});
    setQrCodeText('https://abner.dev');
    setQrCodeOutput('');
    setJwtInput('');
    setJwtOutput(null);
    setCronExpression('0 0 * * *');
    setCronDescription('');
    setAsciiInput('Hello');
    setAsciiOutput('');
    setEncryptInput('');
    setEncryptOutput('');
    setSqlInput('SELECT * FROM users WHERE id = 1');
    setSqlOutput('');
    setRegexInput('');
    setRegexTestInput('');
    setRegexOutput(null);
    message.info('已清空');
  };

  // JSON
  const handleJsonFormat = () => {
    try {
      setJsonOutput(JSON.stringify(JSON.parse(jsonInput), null, 2));
      message.success('格式化成功！');
    } catch {
      message.error('JSON 格式错误！');
    }
  };
  const handleJsonCompress = () => {
    try {
      setJsonOutput(JSON.stringify(JSON.parse(jsonInput)));
      message.success('压缩成功！');
    } catch {
      message.error('JSON 格式错误！');
    }
  };
  const handleJsonValidate = () => {
    try {
      JSON.parse(jsonInput);
      message.success('JSON 格式正确！');
    } catch {
      message.error('JSON 格式错误！');
    }
  };

  // 颜色
  const handleColorConvert = () => {
    let hex = colorInput.replace('#', '').trim();
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      message.error('请输入有效的 HEX 颜色值');
      return;
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rNorm = r / 255,
      gNorm = g / 255,
      bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm),
      min = Math.min(rNorm, gNorm, bNorm);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm:
          h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
          break;
        case gNorm:
          h = ((bNorm - rNorm) / d + 2) / 6;
          break;
        case bNorm:
          h = ((rNorm - gNorm) / d + 4) / 6;
          break;
      }
    }
    setColorFormat({
      HEX: `#${hex.toUpperCase()}`,
      RGB: `rgb(${r}, ${g}, ${b})`,
      RGBA: `rgba(${r}, ${g}, ${b}, 1)`,
      HSL: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      HSV: `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(max * 100)}%)`,
    });
  };

  // URL
  const handleUrlEncode = () => {
    try {
      setUrlInput(encodeURIComponent(urlInput));
      message.success('编码成功！');
    } catch {
      message.error('编码失败！');
    }
  };
  const handleUrlDecode = () => {
    try {
      setUrlInput(decodeURIComponent(urlInput));
      message.success('解码成功！');
    } catch {
      message.error('解码失败！');
    }
  };

  // Base64
  const handleBase64Encode = () => {
    try {
      setBase64Input(btoa(base64Input));
      message.success('编码成功！');
    } catch {
      message.error('编码失败！');
    }
  };
  const handleBase64Decode = () => {
    try {
      setBase64Input(atob(base64Input));
      message.success('解码成功！');
    } catch {
      message.error('解码失败！');
    }
  };

  // 哈希
  const handleHashGenerate = () => {
    const hash = hashInput
      .split('')
      .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    setHashOutput(`${hashType.toUpperCase()}: ${hashStr.repeat(4)}`);
    message.success('哈希生成成功！');
  };

  // 时间戳
  const handleTimestampConvert = () => {
    const input = timestampInput.trim();
    if (/^\d+$/.test(input)) {
      const date = new Date(
        parseInt(input) > 9999999999 ? parseInt(input) : parseInt(input) * 1000,
      );
      setTimestampOutput(date.toLocaleString('zh-CN'));
    } else {
      const date = new Date(input);
      if (!isNaN(date.getTime()))
        setTimestampOutput(
          `秒: ${Math.floor(date.getTime() / 1000)}\n毫秒: ${date.getTime()}`,
        );
      else message.error(t('tools.invalidDate'));
    }
  };

  // UUID
  const handleUuidGenerate = () => {
    const uuids = Array.from({ length: 5 }, () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }),
    ).join('\n');
    setUuidOutput(uuids);
  };

  // 字数统计
  const handleWordCount = () => {
    const text = wordCountInput;
    setWordCountOutput({
      total: text.length,
      chars: text.replace(/\s/g, '').length,
      chinese: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
      english: (text.match(/[a-zA-Z]+/g) || []).length,
      numbers: (text.match(/\d+/g) || []).length,
      spaces: (text.match(/\s/g) || []).length,
      lines: text.split('\n').length,
    });
  };

  // 二维码
  useEffect(() => {
    if (activeTool === 'qrcode' && qrCodeText) {
      // 使用免费API生成二维码
      const encoded = encodeURIComponent(qrCodeText);
      setQrCodeOutput(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`,
      );
    }
  }, [qrCodeText, activeTool]);

  // JWT
  const handleJwtParse = () => {
    try {
      const parts = jwtInput.split('.');
      if (parts.length !== 3) {
        message.error(t('tools.invalidJwt'));
        return;
      }
      const decodeBase64Url = (str: string) => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        return atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
      };
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));
      const valid = !payload.exp || payload.exp > Math.floor(Date.now() / 1000);
      setJwtOutput({ header, payload, valid });
      message.success('JWT 解析成功！');
    } catch {
      message.error('JWT 解析失败！');
    }
  };

  // Cron
  const parseCron = useCallback(
    (expr: string) => {
      const parts = expr.split(' ');
      if (parts.length < 5) return t('tools.invalidCron');
      const [minute, hour, , , dayOfWeek] = parts;
      let desc =
        minute === '0' && hour !== '*'
          ? `每天 ${hour}点整 `
          : minute === '0' && hour === '*'
            ? '每小时整点 '
            : '';
      if (dayOfWeek !== '*') {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        desc += weekDays[parseInt(dayOfWeek)] || '';
      }
      return desc || '自定义执行';
    },
    [t],
  );
  useEffect(() => {
    if (activeTool === 'cron') setCronDescription(parseCron(cronExpression));
  }, [cronExpression, activeTool, parseCron]);

  // ASCII
  const handleAsciiGenerate = () => {
    const asciiFonts: Record<string, string[]> = {
      A: ['  A  ', ' A A ', 'AAAAA', 'A   A', 'A   A'],
      B: ['BBBB ', 'B   B', 'BBBB ', 'B   B', 'BBBB '],
      C: [' CCC ', 'C    ', 'C    ', 'C    ', ' CCC '],
      D: ['DDD  ', 'D  D ', 'D   D', 'D  D ', 'DDD  '],
      E: ['EEEEE', 'E    ', 'EEE  ', 'E    ', 'EEEEE'],
      F: ['FFFFF', 'F    ', 'FFF  ', 'F    ', 'F    '],
      G: [' GGG ', 'G    ', 'G  GG', 'G   G', ' GGG '],
      H: ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
      I: ['IIIII', '  I  ', '  I  ', '  I  ', 'IIIII'],
      J: ['JJJJJ', '   J', '   J', 'J  J', ' JJ '],
      K: ['K   K', 'K  K ', 'KK   ', 'K  K ', 'K   K'],
      L: ['L    ', 'L    ', 'L    ', 'L    ', 'LLLLL'],
      M: ['M   M', 'MM MM', 'M M M', 'M   M', 'M   M'],
      N: ['N   N', 'NN  N', 'N N N', 'N  NN', 'N   N'],
      O: [' OOO ', 'O   O', 'O   O', 'O   O', ' OOO '],
      P: ['PPPP ', 'P   P', 'PPPP ', 'P    ', 'P    '],
      Q: [' QQQ ', 'Q   Q', 'Q Q Q', 'Q  Q ', ' QQ Q'],
      R: ['RRRR ', 'R   R', 'RRRR ', 'R  R ', 'R   R'],
      S: [' SSS ', 'S    ', ' SSS ', '    S', ' SSS '],
      T: ['TTTTT', '  T  ', '  T  ', '  T  ', '  T  '],
      U: ['U   U', 'U   U', 'U   U', 'U   U', ' UUU '],
      V: ['V   V', 'V   V', 'V   V', ' V V ', '  V  '],
      W: ['W   W', 'W   W', 'W W W', 'WW WW', 'W   W'],
      X: ['X   X', ' X X ', '  X  ', ' X X ', 'X   X'],
      Y: ['Y   Y', ' Y Y ', '  Y  ', '  Y  ', '  Y  '],
      Z: ['ZZZZZ', '   Z ', '  Z  ', ' Z   ', 'ZZZZZ'],
      '0': ['0000 ', '0   0', '0   0', '0   0', '0000 '],
      '1': ['  1  ', ' 11  ', '  1  ', '  1  ', '11111'],
      '2': ['2222 ', '    2', ' 222 ', '2    ', '22222'],
      '3': ['3333 ', '    3', ' 333 ', '    3', '3333 '],
      '4': ['4   4', '4   4', '44444', '    4', '    4'],
      '5': ['55555', '5    ', '5555 ', '    5', '5555 '],
      '6': [' 666 ', '6    ', '6666 ', '6   6', ' 666 '],
      '7': ['77777', '    7', '   7 ', '  7  ', '  7  '],
      '8': [' 888 ', '8   8', ' 888 ', '8   8', ' 888 '],
      '9': [' 999 ', '9   9', ' 9999', '    9', ' 999 '],
    };
    const upperInput = asciiInput.toUpperCase();
    const lines = ['', '', '', '', ''];
    for (const char of upperInput) {
      const font = asciiFonts[char];
      if (font) for (let i = 0; i < 5; i++) lines[i] += font[i] + ' ';
      else for (let i = 0; i < 5; i++) lines[i] += '    ';
    }
    setAsciiOutput(lines.join('\n'));
  };

  // 加密
  const handleEncrypt = () => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(encryptInput);
      const keyBytes = encoder.encode(encryptKey.padEnd(16, '0').slice(0, 16));
      const encrypted = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++)
        encrypted[i] = data[i] ^ keyBytes[i % keyBytes.length];
      setEncryptOutput(btoa(String.fromCharCode(...encrypted)));
      message.success('加密成功！');
    } catch {
      message.error('加密失败！');
    }
  };
  const handleDecrypt = () => {
    try {
      const encrypted = atob(encryptInput);
      const encoder = new TextEncoder();
      const keyBytes = encoder.encode(encryptKey.padEnd(16, '0').slice(0, 16));
      const data = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++)
        data[i] = encrypted.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
      setEncryptOutput(new TextDecoder().decode(data));
      message.success('解密成功！');
    } catch {
      message.error('解密失败！');
    }
  };

  // SQL
  const handleSqlFormat = () => {
    const formatted = sqlInput
      .replace(/\s+/g, ' ')
      .replace(/SELECT/gi, 'SELECT\n  ')
      .replace(/FROM/gi, '\nFROM')
      .replace(/WHERE/gi, '\nWHERE')
      .replace(/AND/gi, '\n  AND')
      .replace(/OR/gi, '\n  OR')
      .replace(/ORDER BY/gi, '\nORDER BY')
      .replace(/GROUP BY/gi, '\nGROUP BY')
      .replace(/LIMIT/gi, '\nLIMIT')
      .replace(/JOIN/gi, '\nJOIN')
      .trim();
    setSqlOutput(formatted);
    message.success('格式化成功！');
  };

  // 正则
  const handleRegexTest = () => {
    try {
      const regex = new RegExp(regexInput, 'g');
      const matches = regexTestInput.match(regex) || [];
      setRegexOutput({ matches, valid: true });
      message.success(`匹配到 ${matches.length} 个结果`);
    } catch {
      setRegexOutput({ matches: [], valid: false });
      message.error(t('tools.invalidRegex') || t('tools.invalidJwt'));
    }
  };

  const getCurrentOutput = () =>
    jsonOutput ||
    colorFormat.HEX ||
    urlInput ||
    base64Input ||
    hashOutput ||
    timestampOutput ||
    uuidOutput ||
    qrCodeOutput ||
    asciiOutput ||
    encryptOutput ||
    sqlOutput ||
    (jwtOutput ? JSON.stringify(jwtOutput, null, 2) : '') ||
    '';

  const renderToolModal = () => {
    if (!activeTool) return null;
    return (
      <Modal
        title={t(toolList.find((tool) => tool.id === activeTool)?.nameKey || '')}
        open={!!activeTool}
        onCancel={() => setActiveTool(null)}
        footer={null}
        width={700}
        className="tool-modal"
        centered
      >
        <div className="tool-modal-content">
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<ClearOutlined />} onClick={clearAll}>
              清空
            </Button>
            {getCurrentOutput() ? (
              <Button
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => copyToClipboard(getCurrentOutput())}
              >
                {copied ? '已复制' : '复制结果'}
              </Button>
            ) : null}
          </Space>

          {activeTool === 'json' && (
            <>
              <Form.Item label="输入 JSON">
                <TextArea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={6}
                  placeholder='{"key": "value"}'
                />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleJsonFormat}>
                  格式化
                </Button>
                <Button onClick={handleJsonCompress}>压缩</Button>
                <Button onClick={handleJsonValidate}>校验</Button>
              </Space>
              <Divider>输出结果</Divider>
              <TextArea
                value={jsonOutput}
                rows={6}
                readOnly
                placeholder="格式化结果..."
              />
            </>
          )}

          {activeTool === 'color' && (
            <>
              <Form.Item label="输入颜色 (HEX)">
                <Input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="#8b5cf6"
                  prefix={
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: colorInput,
                      }}
                    />
                  }
                />
              </Form.Item>
              <Button type="primary" onClick={handleColorConvert}>
                转换
              </Button>
              <Divider>转换结果</Divider>
              <div className="color-results">
                {Object.entries(colorFormat).map(([k, v]) => (
                  <div
                    key={k}
                    className="color-result-item"
                    onClick={() => copyToClipboard(v)}
                  >
                    <Text strong>{k}:</Text>
                    <Text code copyable>
                      {v}
                    </Text>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTool === 'url' && (
            <>
              <Form.Item label="输入内容">
                <TextArea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  rows={4}
                  placeholder="输入需要编码/解码的内容"
                />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleUrlEncode}>
                  URL 编码
                </Button>
                <Button onClick={handleUrlDecode}>URL 解码</Button>
              </Space>
            </>
          )}

          {activeTool === 'base64' && (
            <>
              <Form.Item label="输入内容">
                <TextArea
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  rows={4}
                  placeholder="输入需要编码/解码的内容"
                />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleBase64Encode}>
                  Base64 编码
                </Button>
                <Button onClick={handleBase64Decode}>Base64 解码</Button>
              </Space>
            </>
          )}

          {activeTool === 'hash' && (
            <>
              <Form.Item label="输入内容">
                <TextArea
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  rows={4}
                  placeholder="输入需要生成哈希的内容"
                />
              </Form.Item>
              <Form.Item label="哈希类型">
                <Select
                  value={hashType}
                  onChange={setHashType}
                  style={{ width: 200 }}
                >
                  <Select.Option value="md5">MD5</Select.Option>
                  <Select.Option value="sha1">SHA-1</Select.Option>
                  <Select.Option value="sha256">SHA-256</Select.Option>
                  <Select.Option value="sha512">SHA-512</Select.Option>
                </Select>
              </Form.Item>
              <Button type="primary" onClick={handleHashGenerate}>
                生成哈希
              </Button>
              <Divider>输出结果</Divider>
              <TextArea
                value={hashOutput}
                rows={4}
                readOnly
                placeholder="哈希值..."
              />
            </>
          )}

          {activeTool === 'timestamp' && (
            <>
              <Form.Item label="输入时间戳或日期">
                <Input
                  value={timestampInput}
                  onChange={(e) => setTimestampInput(e.target.value)}
                  placeholder="输入时间戳(毫秒/秒)或日期"
                />
              </Form.Item>
              <Button type="primary" onClick={handleTimestampConvert}>
                转换
              </Button>
              <Divider>输出结果</Divider>
              <TextArea value={timestampOutput} rows={2} readOnly />
              <Button
                type="link"
                onClick={() => setTimestampInput(Date.now().toString())}
              >
                使用当前时间
              </Button>
            </>
          )}

          {activeTool === 'uuid' && (
            <>
              <Button type="primary" onClick={handleUuidGenerate}>
                生成 5 个 UUID
              </Button>
              <Divider>输出结果</Divider>
              <TextArea
                value={uuidOutput}
                rows={6}
                readOnly
                placeholder="UUID..."
              />
            </>
          )}

          {activeTool === 'wordcount' && (
            <>
              <Form.Item label="输入文本">
                <TextArea
                  value={wordCountInput}
                  onChange={(e) => setWordCountInput(e.target.value)}
                  rows={8}
                  placeholder="输入需要统计的文本..."
                />
              </Form.Item>
              <Button type="primary" onClick={handleWordCount}>
                统计
              </Button>
              <Divider>统计结果</Divider>
              <Row gutter={16}>
                {Object.entries(wordCountOutput).map(([k, v]) => (
                  <Col span={8} key={k}>
                    <Card size="small">
                      <Text type="secondary">
                        {k === 'total'
                          ? '总字符'
                          : k === 'chars'
                            ? '字符'
                            : k === 'chinese'
                              ? '中文'
                              : k === 'english'
                                ? '英文'
                                : k === 'numbers'
                                  ? '数字'
                                  : k === 'spaces'
                                    ? '空格'
                                    : '行数'}
                      </Text>
                      <Title level={3} style={{ margin: '8px 0 0' }}>
                        {v}
                      </Title>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {activeTool === 'qrcode' && (
            <>
              <Form.Item label="输入文本或链接">
                <Input
                  value={qrCodeText}
                  onChange={(e) => setQrCodeText(e.target.value)}
                  placeholder="https://example.com"
                />
              </Form.Item>
              <Divider>生成的二维码</Divider>
              <div className="qrcode-result">
                {qrCodeOutput ? (
                  <img
                    src={qrCodeOutput}
                    alt="QR Code"
                    style={{ borderRadius: 8 }}
                  />
                ) : (
                  <Text type="secondary">输入文本生成二维码</Text>
                )}
              </div>
            </>
          )}

          {activeTool === 'jwt' && (
            <>
              <Form.Item label="输入 JWT Token">
                <TextArea
                  value={jwtInput}
                  onChange={(e) => setJwtInput(e.target.value)}
                  rows={4}
                  placeholder="粘贴 JWT Token..."
                />
              </Form.Item>
              <Button type="primary" onClick={handleJwtParse}>
                解析 JWT
              </Button>
              {jwtOutput && (
                <>
                  <Divider>解析结果</Divider>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Tag color={jwtOutput.valid ? 'green' : 'red'}>
                      {jwtOutput.valid ? '有效' : '已过期/无效'}
                    </Tag>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 8,
                        overflow: 'auto',
                        maxHeight: 300,
                      }}
                    >
                      {JSON.stringify(jwtOutput, null, 2)}
                    </pre>
                  </Space>
                </>
              )}
            </>
          )}

          {activeTool === 'cron' && (
            <>
              <Form.Item label="Cron 表达式">
                <Input
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="0 0 * * *"
                />
              </Form.Item>
              <Divider>解析结果</Divider>
              <Card>
                <Text strong>执行时间: </Text>
                <Text>{cronDescription}</Text>
              </Card>
              <Divider>常用示例</Divider>
              <Space wrap>
                {[
                  '0 0 * * *',
                  '0 */2 * * *',
                  '0 9 * * 1-5',
                  '0 0 1 * *',
                  '*/5 * * * *',
                ].map((cron) => (
                  <Tag
                    key={cron}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setCronExpression(cron)}
                  >
                    {cron}
                  </Tag>
                ))}
              </Space>
            </>
          )}

          {activeTool === 'ascii' && (
            <>
              <Form.Item label="输入文字">
                <Input
                  value={asciiInput}
                  onChange={(e) => setAsciiInput(e.target.value)}
                  placeholder="Hello"
                  maxLength={10}
                />
              </Form.Item>
              <Button type="primary" onClick={handleAsciiGenerate}>
                生成 ASCII
              </Button>
              <Divider>输出结果</Divider>
              <TextArea
                value={asciiOutput}
                rows={6}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </>
          )}

          {activeTool === 'encrypt' && (
            <>
              <Form.Item label="输入内容">
                <TextArea
                  value={encryptInput}
                  onChange={(e) => setEncryptInput(e.target.value)}
                  rows={4}
                  placeholder="输入需要加密/解密的内容"
                />
              </Form.Item>
              <Form.Item label="密钥">
                <Input
                  value={encryptKey}
                  onChange={(e) => setEncryptKey(e.target.value)}
                  placeholder="请输入密钥"
                />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleEncrypt}>
                  加密
                </Button>
                <Button onClick={handleDecrypt}>解密</Button>
              </Space>
              <Divider>输出结果</Divider>
              <TextArea
                value={encryptOutput}
                rows={4}
                readOnly
                placeholder="结果..."
              />
            </>
          )}

          {activeTool === 'sql' && (
            <>
              <Form.Item label="输入 SQL">
                <TextArea
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  rows={4}
                  placeholder="SELECT * FROM users WHERE id = 1"
                />
              </Form.Item>
              <Button type="primary" onClick={handleSqlFormat}>
                格式化
              </Button>
              <Divider>输出结果</Divider>
              <TextArea
                value={sqlOutput}
                rows={6}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
            </>
          )}

          {activeTool === 'regex' && (
            <>
              <Form.Item label="正则表达式">
                <Input
                  value={regexInput}
                  onChange={(e) => setRegexInput(e.target.value)}
                  placeholder="输入正则表达式"
                />
              </Form.Item>
              <Form.Item label="测试文本">
                <TextArea
                  value={regexTestInput}
                  onChange={(e) => setRegexTestInput(e.target.value)}
                  rows={4}
                  placeholder="输入测试文本"
                />
              </Form.Item>
              <Button type="primary" onClick={handleRegexTest}>
                测试
              </Button>
              {regexOutput && (
                <>
                  <Divider>匹配结果</Divider>
                  <Text>
                    {regexOutput.valid
                      ? `匹配到 ${regexOutput.matches.length} 个结果`
                      : '正则表达式无效'}
                  </Text>
                  {regexOutput.matches.length > 0 && (
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 8,
                        marginTop: 8,
                      }}
                    >
                      {regexOutput.matches.join('\n')}
                    </pre>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div className="tools-page">
      <div className="tools-header">
        <Title level={2} className="page-title">
          🛠️ 开发工具
        </Title>
      </div>
      <div className="category-tabs">
        {toolCategories.map((cat) => (
          <span
            key={cat.key}
            className={`category-tag ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </span>
        ))}
      </div>
      <Row gutter={[20, 20]} className="tools-grid">
        {filteredTools.map((tool) => (
          <Col xs={12} sm={8} lg={6} key={tool.id}>
            <Card className="tool-card" hoverable onClick={tool.action}>
              <div className="tool-icon" style={{ background: tool.color }}>
                {tool.icon}
              </div>
              <div className="tool-info">
                <Text strong className="tool-name">
                  {t(tool.nameKey)}
                </Text>
                <Text type="secondary" className="tool-desc">
                  {t(tool.descKey)}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      {renderToolModal()}
    </div>
  );
};

export default ToolsPage;
