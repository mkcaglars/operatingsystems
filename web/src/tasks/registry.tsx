// Görev arayüzleri. Görev dosyasındaki "arayuz" alanı buradaki anahtarlardan birini gösterir.
import type { ComponentType } from 'react';
import type { Sim } from '../core/sim';
import type { Mode, TaskDef } from '../core/types';
import KurulumOncesi, { initialKurulumOncesi } from './KurulumOncesi';

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
};
