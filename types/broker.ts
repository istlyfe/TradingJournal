export type BrokerType = 
  | 'tdameritrade' 
  | 'interactivebrokers' 
  | 'tradestation'
  | 'tradovate' 
  | 'thinkorswim'
  | 'etrade' 
  | 'webull'
  | 'custom';

export interface BrokerConnection {
  id: string;
  name: string;
  broker: BrokerType;
  accountId?: string;
  isConnected: boolean;
  lastSynced?: string;
  authData?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    [key: string]: any;
  };
}

export interface BrokerCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface BrokerDefinition {
  id: BrokerType;
  name: string;
  description: string;
  logoUrl: string;
  authType: 'oauth' | 'apikey' | 'credentials';
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password';
    required: boolean;
    placeholder?: string;
  }>;
  hasOfficialSupport: boolean;
  authUrl?: string; // For OAuth flows
  tokenUrl?: string; // For OAuth flows
  scopes?: string[]; // For OAuth flows
  docUrl: string;
} 