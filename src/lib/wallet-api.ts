import { apiRequest } from '@/lib/session';

type Raw = Record<string, unknown>;
const record = (value: unknown): Raw => value && typeof value === 'object' && !Array.isArray(value) ? value as Raw : {};
const list = (value: unknown): Raw[] => Array.isArray(value) ? value.map(record) : Array.isArray(record(value).data) ? (record(value).data as unknown[]).map(record) : [];

export type CoinPack = { id: number; name: string; coins: number; price: string; currency: string };

export async function getMyWallet() {
  const response = await apiRequest<unknown>('/v1/wallet/me');
  const data = Array.isArray(response.data) ? record(response.data[0]) : record(response.data);
  const wallet = Object.keys(record(data.wallet)).length ? record(data.wallet) : data;
  const rawBalance = wallet.coin_balance ?? wallet.coins_balance ?? wallet.coins ?? wallet.balance ?? wallet.amount ?? 0;
  const balance = Number(rawBalance);
  return { balance: Number.isFinite(balance) ? balance : 0 };
}

export async function getCoinPacks(language: string): Promise<CoinPack[]> {
  const response = await apiRequest<unknown>('/v1/pricing/reason/coin_price');
  return list(response.data).map((item, index) => {
    const localizedName = record(item.pricing_name);
    const name = localizedName[language] ?? localizedName.fr ?? localizedName.en ?? item.pricing_name;
    const coins = Number(item.coins_amount ?? 0);
    const cost = item.pricing_cost;
    return {
      id: Number(item.id),
      name: typeof name === 'string' ? name : `Pack ${index + 1}`,
      coins: Number.isFinite(coins) ? coins : 0,
      price: cost == null ? '' : String(cost),
      currency: String(item.currency ?? 'USD'),
    };
  }).filter(pack => Number.isInteger(pack.id) && pack.id > 0);
}

export async function purchaseCoins(pricingId: number, type: 1 | 2, channel: string, phone?: string) {
  const response = await apiRequest<unknown>('/v1/wallet/coins/purchase', {
    method: 'POST',
    body: JSON.stringify({ pricing_id: pricingId, type, channel, ...(type === 1 ? { phone: phone?.trim() } : {}) }),
  });
  const data = record(response.data);
  return { url: String(data.url ?? record(data.data).url ?? record(response).url ?? '') };
}
