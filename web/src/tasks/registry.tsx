// Görev arayüzleri. Görev dosyasındaki "arayuz" alanı buradaki anahtarlardan birini gösterir.
import type { ComponentType } from 'react';
import type { Sim } from '../core/sim';
import type { Mode, TaskDef } from '../core/types';
import KurulumOncesi, { initialKurulumOncesi } from './KurulumOncesi';
import CevreBirimi, { initialCevreBirimi } from './CevreBirimi';
import ArkaPanel, { initialArkaPanel } from './ArkaPanel';
import UpsSecimi, { initialUpsSecimi } from './UpsSecimi';
import Kesinti, { initialKesinti } from './Kesinti';
import Siralama, { initialSiralama } from './Siralama';
import BipKodlari, { initialBipKodlari } from './BipKodlari';
import PcBios, { initialPcBios } from './PcBios';

export interface TaskUIProps {
  task: TaskDef;
  mode: Mode;
  // Her görev kendi durum türünü kullanır; çalıştırıcı için türden bağımsızdır.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sim: Sim<any>;
}

export interface TaskUI {
  initial: (task: TaskDef) => unknown;
  Component: ComponentType<TaskUIProps>;
}

export const taskUIs: Record<string, TaskUI> = {
  'kurulum-oncesi': { initial: initialKurulumOncesi, Component: KurulumOncesi },
  'cevre-birimi': { initial: initialCevreBirimi, Component: CevreBirimi },
  'arka-panel': { initial: initialArkaPanel, Component: ArkaPanel },
  'ups-secimi': { initial: initialUpsSecimi, Component: UpsSecimi },
  kesinti: { initial: initialKesinti, Component: Kesinti },
  siralama: { initial: initialSiralama, Component: Siralama },
  'bip-kodlari': { initial: initialBipKodlari, Component: BipKodlari },
  bios: { initial: initialPcBios, Component: PcBios },
};
