import { useState, useRef } from "react";
import { activateLicense } from "@/lib/LicenseManager";
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, File, Clock } from "lucide-react";

export default function LicenseScreen({ onActivated }) {
  const [status, setStatus]     = useState(null);
  const [message, setMessage]   = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [licInfo, setLicInfo]   = useState(null);
  const fileRef = useRef();

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setStatus('error');
      setMessage('Please upload a valid .json license file.');
      return;
    }
    setFileName(file.name);
    setLoading(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        try {
          const data   = JSON.parse(e.target.result);
          const result = activateLicense(data);
          setLoading(false);
          if (result.success) {
            setStatus('success');
            setMessage(result.message);
            // Show license type info
            const typeMap = { trial: '🕐 Trial', monthly: '📅 Monthly', yearly: '📆 Yearly', permanent: '♾️ Permanent' };
            const expText = data.expiresAt === 'PERMANENT'
              ? 'Never expires'
              : 'Expires: ' + new Date(data.expiresAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
            setLicInfo({ type: typeMap[data.licenseType] || data.licenseType, expText });
            setTimeout(() => onActivated(), 2200);
          } else {
            setStatus('error');
            setMessage(result.message);
          }
        } catch {
          setLoading(false);
          setStatus('error');
          setMessage('Could not read the file. Make sure it is a valid license.json file.');
        }
      }, 900);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); };

  const s = {
    wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
            background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'20px', fontFamily:'Segoe UI,sans-serif' },
    inner: { width:'100%', maxWidth:'420px' },
    iconBox: { display:'inline-flex', alignItems:'center', justifyContent:'center',
               width:'80px', height:'80px', borderRadius:'20px',
               background:'linear-gradient(135deg,#3b82f6,#6366f1)',
               boxShadow:'0 20px 40px rgba(0,0,0,0.4)', marginBottom:'16px' },
    card: { background:'#1e293b', border:'1px solid #334155', borderRadius:'20px',
            padding:'32px', boxShadow:'0 25px 50px rgba(0,0,0,0.5)' },
    dropZone: (d,st) => ({
      border:`2px dashed ${d?'#3b82f6':st==='success'?'#22c55e':st==='error'?'#ef4444':'#475569'}`,
      borderRadius:'14px', padding:'36px 20px', textAlign:'center', cursor:'pointer',
      background: d?'rgba(59,130,246,0.08)':'rgba(15,23,42,0.6)',
      transition:'all 0.2s', marginBottom:'16px'
    }),
    spinner: { width:'36px', height:'36px', border:'3px solid #334155',
               borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
    iconWrap: { width:'56px', height:'56px', borderRadius:'14px', background:'#334155',
                display:'flex', alignItems:'center', justifyContent:'center' },
    browsePill: { display:'flex', alignItems:'center', gap:'8px',
                  background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)',
                  borderRadius:'10px', padding:'8px 18px' },
    alert: (st) => ({
      display:'flex', alignItems:'flex-start', gap:'10px', padding:'12px 14px',
      borderRadius:'10px', marginBottom:'14px',
      background: st==='success'?'rgba(21,128,61,0.2)':'rgba(153,27,27,0.2)',
      border:`1px solid ${st==='success'?'#166534':'#991b1b'}`,
      color: st==='success'?'#86efac':'#fca5a5', fontSize:'13px', lineHeight:'1.6'
    }),
    licBadge: { display:'flex', justifyContent:'space-between', alignItems:'center',
                background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)',
                borderRadius:'10px', padding:'10px 14px', marginBottom:'14px' },
  };

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={s.iconBox}><ShieldCheck size={40} color="white" /></div>
          <h1 style={{ color:'#fff', fontSize:'26px', fontWeight:'700', margin:'0 0 6px' }}>Mishkat IT Academy</h1>
          <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Management System — License Activation</p>
        </div>

        <div style={s.card}>
          <h2 style={{ color:'#fff', fontSize:'17px', fontWeight:'600', marginBottom:'8px' }}>Activate Your License</h2>
          <p style={{ color:'#94a3b8', fontSize:'13px', marginBottom:'24px', lineHeight:'1.7' }}>
            Upload the <span style={{ color:'#60a5fa', fontWeight:'600' }}>license.json</span> file received from Mishkat IT Academy after purchase.
          </p>

          <div
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={s.dropZone(dragging, status)}
          >
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} style={{ display:'none' }} />
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                <div style={s.spinner} />
                <p style={{ color:'#94a3b8', fontSize:'14px', margin:0 }}>Verifying license...</p>
              </div>
            ) : status === 'success' ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                <CheckCircle2 size={44} color="#22c55e" />
                <p style={{ color:'#86efac', fontWeight:'600', margin:0 }}>License Verified!</p>
                <p style={{ color:'#64748b', fontSize:'12px', margin:0 }}>{fileName}</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                <div style={s.iconWrap}><File size={28} color="#60a5fa" /></div>
                <div>
                  <p style={{ color:'#fff', fontWeight:'500', margin:'0 0 4px' }}>{fileName || 'Click or drag & drop'}</p>
                  <p style={{ color:'#64748b', fontSize:'12px', margin:0 }}>Upload your license.json file</p>
                </div>
                <div style={s.browsePill}>
                  <Upload size={16} color="#60a5fa" />
                  <span style={{ color:'#93c5fd', fontSize:'14px', fontWeight:'500' }}>Browse File</span>
                </div>
              </div>
            )}
          </div>

          {status && (
            <div style={s.alert(status)}>
              {status === 'success' ? <CheckCircle2 size={16} style={{ marginTop:'2px', flexShrink:0 }} /> : <AlertCircle size={16} style={{ marginTop:'2px', flexShrink:0 }} />}
              <span>{message}</span>
            </div>
          )}

          {licInfo && (
            <div style={s.licBadge}>
              <span style={{ color:'#7dd3fc', fontSize:'13px', fontWeight:'600' }}>{licInfo.type} License</span>
              <span style={{ color:'#475569', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                <Clock size={12} />{licInfo.expText}
              </span>
            </div>
          )}

          <p style={{ textAlign:'center', color:'#475569', fontSize:'12px', margin:0 }}>
            Need a license? Contact <span style={{ color:'#60a5fa' }}>Mishkat IT Academy</span>
          </p>
        </div>
        <p style={{ textAlign:'center', color:'#334155', fontSize:'11px', marginTop:'16px' }}>
          © {new Date().getFullYear()} Mishkat IT Academy. All rights reserved.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
