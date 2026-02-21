// 简化版测试 - 如果这个能显示，说明问题在完整版 App.tsx
export default function SimpleApp() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#8B5CF6', fontSize: '32px', marginBottom: '20px' }}>
        ✅ React 应用已启动
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
        如果你看到这个页面，说明：
      </p>
      <ul style={{ fontSize: '16px', color: '#333', lineHeight: '1.8' }}>
        <li>✅ React 正常工作</li>
        <li>✅ Vite 开发服务器正常</li>
        <li>✅ 浏览器可以加载 JavaScript</li>
      </ul>
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>下一步：</h2>
        <p style={{ color: '#666' }}>
          如果这个简化版能显示，但完整版 App.tsx 是空白的，请：
        </p>
        <ol style={{ color: '#666', lineHeight: '1.8', marginTop: '10px' }}>
          <li>按 F12 打开浏览器开发者工具</li>
          <li>查看 Console 标签页的错误信息</li>
          <li>查看 Network 标签页，确认资源是否加载成功</li>
        </ol>
      </div>
    </div>
  );
}
