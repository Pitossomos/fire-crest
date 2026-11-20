import type { SaveData } from '../data/types';

/** Dados passados entre as cenas de resultado e de gerenciar o time. */
export interface ResultData {
  result: 'victory' | 'defeat';
  stageName: string;
  /** Save já atualizado (vitória) ou o save do início da fase (derrota). */
  save: SaveData;
  /** Mensagem de destaque. */
  message?: string;
  /** Voltando da tela de gerenciar o time (não repete a fanfarra). */
  fromParty?: boolean;
}

export interface PartyData {
  save: SaveData;
  /** Para voltar à tela de resultado com o save atualizado. */
  result: ResultData;
  /** 'promote': abre direto na lista de heróis prontos para promover. */
  focus?: 'promote';
}
