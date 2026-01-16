# Frontend Documentation

## Структура

```
src/
├── api/client.ts      # API клиент
├── types/index.ts     # TypeScript типы
├── store/             # Zustand stores
│   ├── userStore.ts   # Пользователь и авторизация
│   ├── gameStore.ts   # Игровая сессия
│   └── inventoryStore.ts # Инвентарь
├── hooks/
│   ├── useWebSocket.ts # WebSocket соединение
│   └── useFishing.ts   # Хук рыбалки
├── components/
│   ├── ui/Layout.tsx   # Общий layout
│   └── game/
│       ├── FishingCanvas.tsx # Canvas с анимацией
│       ├── FightMeter.tsx    # UI вываживания
│       ├── BiteIndicator.tsx # Индикатор поклёвки
│       └── CatchResult.tsx   # Результат улова
└── pages/
    ├── LoginPage.tsx
    ├── GamePage.tsx
    ├── InventoryPage.tsx
    ├── ShopPage.tsx
    └── ProfilePage.tsx
```

## Stores (Zustand)

### userStore
- `user` - данные пользователя
- `isAuthenticated` - статус авторизации
- `login/logout/register` - методы авторизации
- `updateMoney/addExperience` - обновление локального состояния

### gameStore
- `gameState` - состояние игры (idle/waiting/bite/fighting)
- `fightState` - параметры вываживания
- `currentLocation` - текущая локация
- `lastCatchResult` - результат последнего улова

### inventoryStore
- `items` - предметы в инвентаре
- `equipment` - текущая экипировка
- `purchaseItem/equipItem` - покупка и экипировка

## WebSocket протокол

### Отправка (Client → Server)
```typescript
ws.joinLocation(locationId)  // Присоединиться к локации
ws.cast(power, angle)        // Забросить удочку
ws.hook()                    // Подсечка
ws.reel(speed)               // Подмотка
ws.release()                 // Отпустить леску
ws.setDrag(level)            // Установить фрикцион
ws.hold()                    // Удерживать
```

### Получение (Server → Client)
```typescript
// Обрабатывается в useWebSocket.ts
case 'joined': ...
case 'cast_result': setCastResult(distance, depth)
case 'bite': setBite(fishName, intensity)
case 'fight_started': setFightStarted(fishName, weight)
case 'fight_update': updateFightState(state)
case 'catch': setCatchResult(result)
```

## Компоненты игры

### FishingCanvas
Canvas с анимациями:
- Волны воды
- Удочка и изгиб
- Леска и поплавок
- Рыба при вываживании

### FightMeter
UI вываживания:
- Индикатор натяжения (критический при > 90%)
- Выносливость рыбы
- Дистанция до рыбы
- Состояние лески
- Кнопки: Подмотка, Отпустить
- Слайдер фрикциона

### Состояния рыбы (визуализация)
- **passive** (зелёный) - можно подматывать
- **active** (жёлтый) - держать натяжение
- **rush** (красный) - срочно отпустить!
- **exhausted** (серый) - вытягивать

## Стили

Используется Tailwind CSS с кастомными цветами:
- `water-light/DEFAULT/dark` - цвета воды
- `fish-common/uncommon/rare/epic/legendary` - редкости
