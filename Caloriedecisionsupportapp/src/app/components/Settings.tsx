import { useState } from 'react';
import { MochiAnimated } from './Mochi';

function SettingRow({ icon, label, value, onClick, color = '#FF8B7A' }: {
  icon: string; label: string; value?: string; onClick?: () => void; color?: string;
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: '1px solid #FFF0EB',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = '#FFF8F5')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3D2020' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#C4A89A' }}>{value}</span>}
        {onClick && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#D4BEB8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onToggle, color = '#FF8B7A' }: {
  icon: string; label: string; checked: boolean; onToggle: () => void; color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #FFF0EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3D2020' }}>{label}</span>
      </div>
      <div onClick={onToggle} style={{
        width: 50, height: 28, borderRadius: 14,
        background: checked ? '#FF8B7A' : '#FFE0D0',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.3s ease',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 24 : 3,
          width: 22, height: 22, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'left 0.3s ease',
        }} />
      </div>
    </div>
  );
}

export function SettingsScreen({ userName, calorieGoal, onLogout }: { userName: string; calorieGoal: number; onLogout: () => void }) {
  const [notifs, setNotifs] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [mochiSound, setMochiSound] = useState(false);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#FDF6F0', fontFamily: "'Nunito', sans-serif", paddingBottom: 30 }}>
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#3D2020' }}>My Profile</div>
      </div>

      <div style={{
        margin: '20px 20px 0',
        background: 'linear-gradient(145deg, #FFF5F0, #FFE8E0)',
        borderRadius: 28, padding: '24px 20px',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ position: 'relative' }}>
          <MochiAnimated state="happy" size={72} />
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 22, height: 22, borderRadius: '50%',
            background: '#FF8B7A', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10,
          }}>✏️</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3D2020' }}>{userName}</div>
          <div style={{ fontSize: 13, color: '#C4A89A', marginTop: 2 }}>Bloom stage 🌸 · 5 day streak 🔥</div>
          <div style={{ marginTop: 8, background: '#FF8B7A', borderRadius: 12, padding: '5px 14px', display: 'inline-block' }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {calorieGoal.toLocaleString()} kcal / day
            </span>
          </div>
        </div>
      </div>

      <div style={{ margin: '20px 20px 0' }}>
        <div style={{ fontSize: 13, color: '#C4A89A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Goals</div>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
          <SettingRow icon="🎯" label="Daily calorie goal" value={`${calorieGoal.toLocaleString()} kcal`} onClick={() => {}} color="#FF8B7A" />
          <SettingRow icon="⚖️" label="Current weight" value="68 kg" onClick={() => {}} color="#FFB5A7" />
          <SettingRow icon="🏁" label="Target weight" value="62 kg" onClick={() => {}} color="#FFD166" />
          <SettingRow icon="📅" label="Weekly goal" value="−0.5 kg" onClick={() => {}} color="#FF8B7A" />
        </div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 13, color: '#C4A89A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Mochi Settings</div>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
          <SettingRow icon="🍡" label="Companion name" value="Mochi" onClick={() => {}} color="#FF8B7A" />
          <ToggleRow icon="🔔" label="Meal reminders" checked={reminders} onToggle={() => setReminders(!reminders)} color="#FFB5A7" />
          <ToggleRow icon="🎵" label="Mochi sounds" checked={mochiSound} onToggle={() => setMochiSound(!mochiSound)} color="#FFD166" />
        </div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 13, color: '#C4A89A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Notifications</div>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
          <ToggleRow icon="📲" label="Daily check-in" checked={notifs} onToggle={() => setNotifs(!notifs)} color="#FF8B7A" />
          <SettingRow icon="⏰" label="Reminder time" value="8:00 AM" onClick={() => {}} color="#FFB5A7" />
        </div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
          <SettingRow icon="💌" label="Send feedback" onClick={() => {}} color="#FFB5A7" />
          <SettingRow icon="🌟" label="Rate fitty" onClick={() => {}} color="#FFD166" />
          <SettingRow icon="🔒" label="Privacy" onClick={() => {}} color="#C4A89A" />
        </div>
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,140,120,0.07)' }}>
          <div onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FFF8F5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#FF8B7A' }}>
              Log out
            </span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#D4BEB8' }}>
        fitty v1.0 · Made with 🍡 and love
      </div>
    </div>
  );
}
