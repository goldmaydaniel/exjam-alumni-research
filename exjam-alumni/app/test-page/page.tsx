export default function TestPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Page</h1>
      <p>If you can see this, the app is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
