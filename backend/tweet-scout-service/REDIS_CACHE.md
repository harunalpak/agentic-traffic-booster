# Redis Tweet Deduplication Cache

## 🎯 Amaç

Tweet Scout Service'in aynı tweet'leri tekrar tekrar işlememesi için Redis tabanlı önbellekleme sistemi.

## ✨ Özellikler

### 1. Otomatik Tekrar Kontrolü
- Her bulunan tweet 24 saat boyunca Redis'te saklanır
- Aynı tweet tekrar bulunduğunda otomatik olarak filtrelenir
- Sadece yeni (daha önce görülmemiş) tweet'ler işlenir

### 2. Performanslı Batch İşleme
- Pipeline kullanarak çoklu tweet kontrolü
- Minimum gecikme ile hızlı filtreleme
- Redis bağlantı havuzu yönetimi

### 3. Otomatik TTL Yönetimi
- 24 saat sonra tweet'ler otomatik olarak silinir
- Memory-efficient: LRU eviction policy
- Disk persistence: AOF (Append Only File)

## 🏗️ Mimari

```
┌─────────────────┐
│ Tweet Scraper   │
└────────┬────────┘
         │
         ├─> Scrape Tweets
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ filterUnseen    │◄────►│    Redis     │
│    Tweets       │      │   Cache      │
└────────┬────────┘      └──────────────┘
         │                 TTL: 24 hours
         ├─> Return New Tweets
         │
         ▼
┌─────────────────┐
│ markTweetsAs    │
│     Seen        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Publish to      │
│    Kafka        │
└─────────────────┘
```

## 📋 Kullanılan Fonksiyonlar

### `filterUnseenTweets(tweets)`
Daha önce görülmeyen tweet'leri filtreler.

```javascript
const unseenTweets = await filterUnseenTweets(allTweets);
// Sadece yeni tweet'leri döner
```

### `markTweetsAsSeen(tweets, campaignId)`
Tweet'leri görüldü olarak işaretler.

```javascript
await markTweetsAsSeen(newTweets, campaignId);
// 24 saat boyunca cache'de tutulur
```

### `getCacheStats()`
Cache istatistiklerini getirir.

```javascript
const stats = await getCacheStats();
console.log(stats);
// {
//   totalCachedTweets: 150,
//   cachePrefix: 'tweet:seen:',
//   ttlHours: 24
// }
```

## 🔧 Konfigürasyon

### Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost          # Redis host
REDIS_PORT=6379              # Redis port
REDIS_PASSWORD=              # Optional password
```

### Docker Compose

```yaml
redis:
  image: redis:7-alpine
  container_name: atb-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## 📊 Cache İstatistikleri

Her scrape cycle sonunda otomatik olarak loglanır:

```
========================================
📊 Tweet Scout Summary:
   Campaigns Processed: 3
   Campaigns Failed: 0
   Total Tweets Found: 25
   Total Tweets Published: 15
   Duration: 12.34s
----------------------------------------
🗄️  Cache Statistics:
   Cached Tweets (24h): 150
   Cache TTL: 24 hours
========================================
```

## 🚀 Kullanım

### Otomatik (Önerilen)

Tweet Scraper otomatik olarak cache'i kontrol eder ve günceller:

```javascript
// tweetScraper.js içinde
const realTweets = await scrapeTweetsForCampaign(campaign);

// Otomatik filtreleme
const unseenTweets = await filterUnseenTweets(realTweets);

if (unseenTweets.length > 0) {
  // Otomatik cache'e ekleme
  await markTweetsAsSeen(unseenTweets, campaign.id);
  return unseenTweets;
}
```

### Manuel Kontrol

```javascript
import { isTweetSeen, markTweetAsSeen } from './services/tweetCache.js';

// Tek tweet kontrolü
if (await isTweetSeen(tweetId)) {
  console.log('Bu tweet daha önce işlendi');
}

// Tek tweet ekleme
await markTweetAsSeen(tweetId, campaignId);
```

## 🧪 Test

### Cache Temizleme (Development)

```javascript
import { clearTweetCache } from './services/tweetCache.js';

const deletedCount = await clearTweetCache();
console.log(`${deletedCount} tweet cache'den silindi`);
```

### Redis Bağlantı Testi

```bash
# Docker container'a bağlan
docker exec -it atb-redis redis-cli

# Cache'deki tweet'leri listele
KEYS tweet:seen:*

# Belirli bir tweet'i kontrol et
GET tweet:seen:1234567890

# Cache boyutunu kontrol et
DBSIZE
```

## 🔍 İzleme ve Debug

### Log Mesajları

```
✅ Tweet marked as seen         # Tek tweet eklendi
✅ Marked 10 tweets as seen     # Batch işlem başarılı
🔍 Filtered out 5 already-seen tweets, 3 new tweets  # Filtreleme sonucu
⚠️  Redis check failed         # Redis hatası (tweet işleme devam eder)
```

### Hata Durumları

Redis bağlantı hatası durumunda:
- Tweet'ler **işlenmeye devam eder** (fail-safe)
- Log'da warning mesajı görünür
- Duplicate'ler olabilir ama sistem durmuş olmaz

## 🎯 Avantajlar

1. **Duplicate Prevention**: Aynı tweet'i 2 kere işlemez
2. **Resource Optimization**: Gereksiz API çağrıları ve işlemler önlenir
3. **Cost Reduction**: Kafka mesajları ve LLM API çağrıları azalır
4. **Better Analytics**: Gerçek unique tweet sayısı görülür
5. **Scalable**: Distributed environment'larda çalışır

## 📈 Performans

- **Batch Check**: ~10ms for 100 tweets
- **Single Check**: ~1-2ms per tweet
- **Memory Usage**: ~100 bytes per cached tweet
- **24h Cache**: ~2.4MB for 25,000 tweets

## 🔐 Güvenlik

- Redis password authentication destekli
- Network izolasyonu (Docker network)
- Sadece internal servislerden erişim
- Sensitive data yok (sadece tweet ID'ler)

## 🐛 Troubleshooting

### Problem: Redis'e bağlanamıyor

```bash
# Redis container'ının çalıştığını kontrol et
docker ps | grep redis

# Redis loglarını kontrol et
docker logs atb-redis

# Manuel bağlantı testi
docker exec -it atb-redis redis-cli ping
# Expected: PONG
```

### Problem: Cache çalışmıyor

```javascript
// Cache stats kontrol et
const stats = await getCacheStats();
console.log(stats);

// Manuel test
await markTweetAsSeen('test123', 1);
const seen = await isTweetSeen('test123');
console.log('Seen:', seen); // Should be true
```

### Problem: Memory doldu

```bash
# Redis memory kullanımı
docker exec -it atb-redis redis-cli INFO memory

# Cache'i temizle (development only)
docker exec -it atb-redis redis-cli FLUSHDB
```

## 📝 Best Practices

1. **Production'da cache temizleme**: Sadece maintenance sırasında
2. **Monitoring**: Redis memory ve connection pool'u izle
3. **Backup**: Redis AOF dosyasını düzenli yedekle
4. **Scaling**: Redis Cluster kullan (çok yüksek volume için)
5. **TTL Tuning**: İhtiyaca göre 24 saat ayarını değiştir

## 🔄 Güncellemeler

**v1.0.0** - Initial Redis cache implementation
- 24 hour TTL
- Batch processing
- Auto-expiration
- Cache statistics
