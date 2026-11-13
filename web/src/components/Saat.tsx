// Gerçek saat (dakikada bir güncellenir): görev çubuğu ve Ubuntu üst çubuğu için.
import { useEffect, useState } from 'react';

export function useSaat() {
  const [d, setD] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setD(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return d;
}

export function WindowsSaat() {
  const d = useSaat();
  return (
    <>
      {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      <br />
      {d.toLocaleDateString('tr-TR')}
    </>
  );
}

export function UbuntuSaat() {
  const d = useSaat();
  return <span>{`${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}</span>;
}
