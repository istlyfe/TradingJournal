import { BrokerDefinition, BrokerType } from "@/types/broker";

export const brokerDefinitions: Record<BrokerType, BrokerDefinition> = {
  tdameritrade: {
    id: 'tdameritrade',
    name: 'TD Ameritrade',
    description: 'Connect to your TD Ameritrade account to automatically import trades.',
    logoUrl: '/images/brokers/tdameritrade.svg',
    authType: 'oauth',
    fields: [
      {
        name: 'clientId',
        label: 'Consumer Key',
        type: 'text',
        required: true,
        placeholder: 'Your TD Ameritrade API Consumer Key'
      }
    ],
    hasOfficialSupport: true,
    authUrl: 'https://auth.tdameritrade.com/auth',
    tokenUrl: 'https://api.tdameritrade.com/v1/oauth2/token',
    scopes: ['trading', 'accountaccess'],
    docUrl: 'https://developer.tdameritrade.com/apis'
  },
  
  interactivebrokers: {
    id: 'interactivebrokers',
    name: 'Interactive Brokers',
    description: 'Connect to your Interactive Brokers account to automatically import trades.',
    logoUrl: '/images/brokers/interactivebrokers.svg',
    authType: 'oauth',
    fields: [
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Your IB Client Portal API Client ID'
      }
    ],
    hasOfficialSupport: true,
    authUrl: 'https://www.interactivebrokers.com/venus/auth',
    tokenUrl: 'https://www.interactivebrokers.com/venus/accesstoken',
    scopes: ['read'],
    docUrl: 'https://www.interactivebrokers.com/en/index.php?f=5041'
  },
  
  tradestation: {
    id: 'tradestation',
    name: 'TradeStation',
    description: 'Connect to your TradeStation account to automatically import trades.',
    logoUrl: '/images/brokers/tradestation.svg',
    authType: 'oauth',
    fields: [
      {
        name: 'clientId',
        label: 'App Key',
        type: 'text',
        required: true,
        placeholder: 'Your TradeStation API App Key'
      },
      {
        name: 'clientSecret',
        label: 'App Secret',
        type: 'password',
        required: true,
        placeholder: 'Your TradeStation API App Secret'
      }
    ],
    hasOfficialSupport: true,
    authUrl: 'https://api.tradestation.com/v2/authorize',
    tokenUrl: 'https://api.tradestation.com/v2/security/authorize',
    scopes: ['ReadAccount'],
    docUrl: 'https://developer.tradestation.com/docs/overview'
  },
  
  tradovate: {
    id: 'tradovate',
    name: 'Tradovate',
    description: 'Connect to your Tradovate account to automatically import trades.',
    logoUrl: '/images/brokers/tradovate.svg',
    authType: 'credentials',
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Your Tradovate Username'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Your Tradovate Password'
      }
    ],
    hasOfficialSupport: false,
    docUrl: 'https://tradovateapi.com/docs'
  },
  
  thinkorswim: {
    id: 'thinkorswim',
    name: 'ThinkOrSwim',
    description: 'Connect to your ThinkOrSwim account (uses TD Ameritrade APIs)',
    logoUrl: '/images/brokers/thinkorswim.svg',
    authType: 'oauth',
    fields: [
      {
        name: 'clientId',
        label: 'Consumer Key',
        type: 'text',
        required: true,
        placeholder: 'Your TD Ameritrade API Consumer Key'
      }
    ],
    hasOfficialSupport: true,
    authUrl: 'https://auth.tdameritrade.com/auth',
    tokenUrl: 'https://api.tdameritrade.com/v1/oauth2/token',
    scopes: ['trading', 'accountaccess'],
    docUrl: 'https://developer.tdameritrade.com/apis'
  },
  
  etrade: {
    id: 'etrade',
    name: 'E*TRADE',
    description: 'Connect to your E*TRADE account to automatically import trades.',
    logoUrl: '/images/brokers/etrade.svg',
    authType: 'oauth',
    fields: [
      {
        name: 'clientId',
        label: 'Consumer Key',
        type: 'text',
        required: true,
        placeholder: 'Your E*TRADE API Consumer Key'
      },
      {
        name: 'clientSecret',
        label: 'Consumer Secret',
        type: 'password',
        required: true,
        placeholder: 'Your E*TRADE API Consumer Secret'
      }
    ],
    hasOfficialSupport: true,
    authUrl: 'https://us.etrade.com/e/t/etws/authorize',
    tokenUrl: 'https://api.etrade.com/oauth/access_token',
    scopes: [],
    docUrl: 'https://developer.etrade.com/home'
  },
  
  webull: {
    id: 'webull',
    name: 'Webull',
    description: 'Connect to your Webull account to automatically import trades.',
    logoUrl: '/images/brokers/webull.svg',
    authType: 'credentials',
    fields: [
      {
        name: 'username',
        label: 'Email',
        type: 'text',
        required: true,
        placeholder: 'Your Webull Email'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Your Webull Password'
      }
    ],
    hasOfficialSupport: false,
    docUrl: 'https://www.webull.com/'
  },
  
  custom: {
    id: 'custom',
    name: 'Custom Broker',
    description: 'Configure a custom broker integration.',
    logoUrl: '/images/brokers/custom.svg',
    authType: 'apikey',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your broker API Key'
      },
      {
        name: 'apiSecret',
        label: 'API Secret',
        type: 'password',
        required: false,
        placeholder: 'Your broker API Secret (if required)'
      },
      {
        name: 'baseUrl',
        label: 'API Base URL',
        type: 'text',
        required: true,
        placeholder: 'https://api.yourbroker.com'
      }
    ],
    hasOfficialSupport: false,
    docUrl: ''
  }
}; 