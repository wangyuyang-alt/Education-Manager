import { toast } from 'sonner';
import { Copy, Zap, Sparkles, Send, Check } from 'lucide-react';
import React, { useState } from 'react';
const AiMarketing = () => {
  const [formData, setFormData] = useState({
    courseName: '',
    targetAudience: '',
    courseFeatures: '',
    schedule: ''
  });
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateMarketingCopy = async () => {
    if (!formData.courseName || !formData.targetAudience) {
      toast.error('请至少填写课程名称和目标受众');
      return;
    }

    setIsGenerating(true);
    setGeneratedCopy(''); // 清空之前的生成结果
    
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'YOUR-DEEPSEEK-API-KEY' 
        },
        body: JSON.stringify({
          stream: false,
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个资深的教培行业招生文案专家。请根据用户提供的课程信息，写一篇吸引人的朋友圈招生文案。铁律：1. 严格根据【目标受众】决定语气，若是成人绝不能出现\'孩子/家长\'等词，若是少儿则以让家长放心的口吻；2. 必须100%提取并改写用户填写的【课程特色与卖点】，绝不准自己编造\'因材施教/科学体系\'等废话；3. 排版需包含：痛点提问开头、提炼核心卖点（带✅符号）、上课时间、紧迫感行动呼吁。字数200字左右，合理使用Emoji。'
            },
            {
              role: 'user',
              content: `课程名称：${formData.courseName}\n目标受众：${formData.targetAudience}\n课程特色与卖点：${formData.courseFeatures}\n上课安排：${formData.schedule}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 解析API响应，获取生成的文案
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        setGeneratedCopy(data.choices[0].message.content);
        toast.success('AI 文案生成成功！');
      } else {
        throw new Error('API返回数据格式不正确');
      }
    } catch (error) {
      console.error('生成文案失败:', error);
      setGeneratedCopy('哎呀，AI 助手开小差了，请稍后再试或检查网络~');
      toast.error('生成文案失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCopy);
      setCopySuccess(true);
      toast.success('文案已复制，快去发朋友圈吧！');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      toast.error('复制失败，请手动复制文案');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Zap className="h-10 w-10 text-purple-600" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI 招生助手
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-lg">
            智能生成吸引人的朋友圈招生文案，让您的课程脱颖而出
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧表单区域 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Zap className="h-6 w-6 text-purple-600 mr-2" />
              课程信息
            </h2>

            <div className="space-y-6">
              {/* 课程名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  placeholder="例如：少儿街舞启蒙班"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 目标受众 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标受众 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="例如：4-6岁零基础儿童"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 课程特色与卖点 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程特色与卖点
                </label>
                <textarea
                  name="courseFeatures"
                  value={formData.courseFeatures}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="描述一下您的课程优势，比如'小班教学、考级包过、免费试听'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* 上课安排 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上课安排
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  placeholder="例如：每周六下午2点-4点"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 生成按钮 */}
              <button
                onClick={generateMarketingCopy}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>AI 正在疯狂撰写中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6" />
                    <span>✨ AI 一键生成朋友圈文案</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Send className="h-6 w-6 text-blue-600 mr-2" />
                文案预览
              </h2>
              {generatedCopy && (
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    copySuccess 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copySuccess ? '已复制!' : '一键复制'}</span>
                </button>
              )}
            </div>

            {/* 手机屏幕样式的预览区 */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-[3rem] p-4 shadow-2xl">
              <div className="bg-black rounded-[2.5rem] p-2">
                <div className="bg-white rounded-[2rem] p-4 h-[500px] overflow-y-auto">
                  {generatedCopy ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                        {generatedCopy}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Zap className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-center">
                        填写课程信息<br />
                        让 AI 为您施展魔法...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {generatedCopy && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">💡 使用建议：</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 可以配上精美的课程图片或学员作品</li>
                  <li>• 添加您的联系方式或二维码</li>
                  <li>• 根据发布时间调整文案语气</li>
                  <li>• 定期更新文案保持新鲜感</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiMarketing;
