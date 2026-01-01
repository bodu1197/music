# ytmusicapi get_home() Supported Countries

Test Date: 2026-01-02

## Summary

| Item | Count |
|------|-------|
| Total ISO Countries | 249 |
| Supported | 109 |
| Unsupported | 140 |
| Success Rate | 43.8% |

---

## Supported Countries (109)

| Code | Country |
|------|---------|
| AE | United Arab Emirates |
| AR | Argentina |
| AT | Austria |
| AU | Australia |
| AZ | Azerbaijan |
| BA | Bosnia and Herzegovina |
| BD | Bangladesh |
| BE | Belgium |
| BG | Bulgaria |
| BH | Bahrain |
| BO | Bolivia |
| BR | Brazil |
| BY | Belarus |
| CA | Canada |
| CH | Switzerland |
| CL | Chile |
| CO | Colombia |
| CR | Costa Rica |
| CY | Cyprus |
| CZ | Czech Republic |
| DE | Germany |
| DK | Denmark |
| DO | Dominican Republic |
| DZ | Algeria |
| EC | Ecuador |
| EE | Estonia |
| EG | Egypt |
| ES | Spain |
| FI | Finland |
| FR | France |
| GB | United Kingdom |
| GE | Georgia |
| GH | Ghana |
| GR | Greece |
| GT | Guatemala |
| HK | Hong Kong |
| HN | Honduras |
| HR | Croatia |
| HU | Hungary |
| ID | Indonesia |
| IE | Ireland |
| IL | Israel |
| IN | India |
| IQ | Iraq |
| IS | Iceland |
| IT | Italy |
| JM | Jamaica |
| JO | Jordan |
| JP | Japan |
| KE | Kenya |
| KH | Cambodia |
| KR | South Korea |
| KW | Kuwait |
| KZ | Kazakhstan |
| LA | Laos |
| LB | Lebanon |
| LI | Liechtenstein |
| LK | Sri Lanka |
| LT | Lithuania |
| LU | Luxembourg |
| LV | Latvia |
| LY | Libya |
| MA | Morocco |
| ME | Montenegro |
| MK | North Macedonia |
| MT | Malta |
| MX | Mexico |
| MY | Malaysia |
| NG | Nigeria |
| NI | Nicaragua |
| NL | Netherlands |
| NO | Norway |
| NP | Nepal |
| NZ | New Zealand |
| OM | Oman |
| PA | Panama |
| PE | Peru |
| PG | Papua New Guinea |
| PH | Philippines |
| PK | Pakistan |
| PL | Poland |
| PR | Puerto Rico |
| PT | Portugal |
| PY | Paraguay |
| QA | Qatar |
| RO | Romania |
| RS | Serbia |
| RU | Russia |
| SA | Saudi Arabia |
| SE | Sweden |
| SG | Singapore |
| SI | Slovenia |
| SK | Slovakia |
| SN | Senegal |
| SV | El Salvador |
| TH | Thailand |
| TN | Tunisia |
| TR | Turkey |
| TW | Taiwan |
| TZ | Tanzania |
| UA | Ukraine |
| UG | Uganda |
| US | United States |
| UY | Uruguay |
| VE | Venezuela |
| VN | Vietnam |
| YE | Yemen |
| ZA | South Africa |
| ZW | Zimbabwe |

---

## Country Codes Array (for code usage)

```typescript
export const YTMUSIC_SUPPORTED_COUNTRIES = [
  "AE", "AR", "AT", "AU", "AZ", "BA", "BD", "BE", "BG", "BH",
  "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ",
  "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR",
  "GB", "GE", "GH", "GR", "GT", "HK", "HN", "HR", "HU", "ID",
  "IE", "IL", "IN", "IQ", "IS", "IT", "JM", "JO", "JP", "KE",
  "KH", "KR", "KW", "KZ", "LA", "LB", "LI", "LK", "LT", "LU",
  "LV", "LY", "MA", "ME", "MK", "MT", "MX", "MY", "NG", "NI",
  "NL", "NO", "NP", "NZ", "OM", "PA", "PE", "PG", "PH", "PK",
  "PL", "PR", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE",
  "SG", "SI", "SK", "SN", "SV", "TH", "TN", "TR", "TW", "TZ",
  "UA", "UG", "US", "UY", "VE", "VN", "YE", "ZA", "ZW"
] as const;
```

---

## Unsupported Countries (140)

AD, AF, AG, AI, AL, AM, AO, AQ, AS, AW, AX, BB, BF, BI, BJ, BL, BM, BN, BQ, BS,
BT, BV, BW, BZ, CC, CD, CF, CG, CI, CK, CM, CN, CU, CV, CW, CX, DJ, DM, EH, ER,
ET, FJ, FK, FM, FO, GA, GD, GF, GG, GI, GL, GM, GN, GP, GQ, GS, GU, GW, GY, HM,
HT, IM, IO, IR, JE, KG, KI, KM, KN, KP, KY, LC, LR, LS, MC, MD, MF, MG, MH, ML,
MM, MN, MO, MP, MQ, MR, MS, MU, MV, MW, MZ, NA, NC, NE, NF, NR, NU, PF, PM, PN,
PS, PW, RE, RW, SB, SC, SD, SH, SJ, SL, SM, SO, SR, SS, ST, SX, SY, SZ, TC, TD,
TF, TG, TJ, TK, TL, TM, TO, TT, TV, UM, UZ, VA, VC, VG, VI, VU, WF, WS, YT, ZM

### Notable Unsupported:
- CN (China) - Blocked
- IR (Iran) - Sanctions
- KP (North Korea) - Sanctions
- CU (Cuba) - Sanctions
- MM (Myanmar)
- SY (Syria)
