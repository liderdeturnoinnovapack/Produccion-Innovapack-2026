/* ============================================================================
   shared/inventario_base.js  —  INVENTARIO FISICO (corte inicial)
   Corte: 17/07/2026. Cargado desde el conteo fisico de bodega.
   Base para el stock real: Stock = Base + Produccion(desde el corte) - Salidas.
   ========================================================================== */
window.INVENTARIO_BASE = {
"fechaCorte": "2026-07-17",
"pt": [
{
"siesa": "5020262",
"referencia": "BOLSA VALV CONSTRUFORTH CERAMICO 25 KG",
"und": 32594,
"kg": 488.91
},
{
"siesa": "5040018",
"referencia": "FLOW PACK PROCOLMAT 2KG",
"und": 30050,
"kg": 300.5
},
{
"siesa": "5010232",
"referencia": "BOLSA AB NIPLE BLANCO",
"und": 26200,
"kg": 235.8
},
{
"siesa": "5010330",
"referencia": "BOLSA AGUA FUENTE PURA  6 LT CON VAL",
"und": 21780,
"kg": 544.5
},
{
"siesa": "5010457",
"referencia": "BOLSA AGUA SAN REMO 6,5 LT CON VAL",
"und": 21349,
"kg": 533.725
},
{
"siesa": "5010453",
"referencia": "BOLSA AB SFSN BOCHERINNI NEGRO",
"und": 20700,
"kg": 372.6
},
{
"siesa": "5040070",
"referencia": "FLOW PACK 140000 PEG FACH FLEXIBLES 5 KG",
"und": 20350,
"kg": 407.0
},
{
"siesa": "5010376",
"referencia": "BOLSA AGUA VIVA SAN MIGUEL 7 LT SIN VAL",
"und": 20000,
"kg": 500.0
},
{
"siesa": "5010174",
"referencia": "BOLSA AB SIFON FLEXIBLE SCLV  CANASTILLA",
"und": 14500,
"kg": 261.0
},
{
"siesa": "5010425",
"referencia": "BOLSA AGUA BECERRA 6 LT SIN VALV",
"und": 14330,
"kg": 358.25
},
{
"siesa": "5010123",
"referencia": "BOLSA AB ECOTERRA ECOCERAMICA",
"und": 13470,
"kg": 673.5
},
{
"siesa": "5020029",
"referencia": "BOLSA VALV PEGOYA CERAMICO GRIS 25KG",
"und": 13099,
"kg": 327.475
},
{
"siesa": "5010391",
"referencia": "BOLSA AB TIPO B CABELLO DE ANGEL X 1K",
"und": 13000,
"kg": 156.0
},
{
"siesa": "5010373",
"referencia": "BOLSA AGUA PU DE LA FUEN  7.5 LT CON VAL",
"und": 11750,
"kg": 329.0
},
{
"siesa": "5020276",
"referencia": "BOLSA VAL PEGA TODO CON LATEX 25 KG",
"und": 11400,
"kg": 570.0
},
{
"siesa": "5020263",
"referencia": "BOLSA VALV CONSTRUFORTH PORCEL 25 KG",
"und": 11350,
"kg": 567.5
},
{
"siesa": "5010352",
"referencia": "BOLSA AGUA 6 LITROS MERCACENTRO CON VAL",
"und": 10900,
"kg": 272.5
},
{
"siesa": "5010354",
"referencia": "BOLSA AGUA DE LA MONTAÑA  6LT SIN VAL",
"und": 10450,
"kg": 261.25
},
{
"siesa": "5010342",
"referencia": "BOLSA AGUA PURA DE ORO 6.5 LT CON VAL",
"und": 10000,
"kg": 250.0
},
{
"siesa": "5010407",
"referencia": "BOLSA AB FLEISHMAN 1 KG",
"und": 9300,
"kg": 74.4
},
{
"siesa": "5010355",
"referencia": "BOLSA AB FRUT CRISTALIZADA COBURGOS X2.5",
"und": 8900,
"kg": 106.8
},
{
"siesa": "5020256",
"referencia": "BOLSA VALV MEGA PLUS GRIS 25 KG",
"und": 8086,
"kg": 404.3
},
{
"siesa": "5010361",
"referencia": "BOLSA AB FRUTA CRISTALIZADA LEVAPAN X 1K",
"und": 8000,
"kg": 64.0
},
{
"siesa": "5020228",
"referencia": "BOLSA VALV PEGO PROFESIONAL RECUPER 25KG",
"und": 7520,
"kg": 376.0
},
{
"siesa": "5020264",
"referencia": "BOLSA ABIERTA PEGA BUENO CERAM 25 KG",
"und": 7140,
"kg": 357.0
},
{
"siesa": "5010314",
"referencia": "BOLSA AGUA  AQUAROSA  SIN VAL",
"und": 7000,
"kg": 175.0
},
{
"siesa": "5040051",
"referencia": "FLOW PACK IMPADOC CEMENTO BLANCO 1 KG",
"und": 6900,
"kg": 55.2
},
{
"siesa": "5020013",
"referencia": "BOLSA VALV PEGOPERFECTO VERDE 40KG",
"und": 6870,
"kg": 549.6
},
{
"siesa": "5010349",
"referencia": "BOLSA AB PADULA SUPER ESTUCO 25KG",
"und": 6600,
"kg": 462.0
},
{
"siesa": "5010448",
"referencia": "BOLSA AGUA GENERICA INNOVA 7 LT SIN",
"und": 6300,
"kg": 157.5
},
{
"siesa": "5010367",
"referencia": "BOLSA AGUA BRIS 7 LT CON VAL",
"und": 5900,
"kg": 147.5
},
{
"siesa": "5020037",
"referencia": "BOLSA VALV PIGMENTOS 80 SIN IMPRESION",
"und": 5827,
"kg": 66.428
},
{
"siesa": "5040090",
"referencia": "FLOW PACK ARENA PARA GATOS MOCHI 5 KG",
"und": 5000,
"kg": 260.0
},
{
"siesa": "5020207",
"referencia": "BOLSA VALV PEGAKELIN CER. EXPORTACI 25KG",
"und": 5000,
"kg": 300.0
},
{
"siesa": "5010380",
"referencia": "BOLSA AB SIFON FLEXI. SENCILLO B-SFSN-01",
"und": 5000,
"kg": 4.0
},
{
"siesa": "5010441",
"referencia": "BOLSA AGUA H20 NATURAL 6,5 LT SIN VALV",
"und": 5000,
"kg": 125.0
},
{
"siesa": "5010124",
"referencia": "BOLSA AB ECOTERRA ECOLATEX",
"und": 4774,
"kg": 238.7
},
{
"siesa": "5010379",
"referencia": "BOLSA AGUA H2O ARMERO 6 LT SIN VAL",
"und": 4700,
"kg": 117.5
},
{
"siesa": "5020187",
"referencia": "BOLSA VALV PROCOL PORCELAN CON LATE 25KG",
"und": 4600,
"kg": 46.0
},
{
"siesa": "5010430",
"referencia": "BOLSA ABIERTA MAXTRTILE CERAM GRIS 25 KG",
"und": 4500,
"kg": 225.0
},
{
"siesa": "5010455",
"referencia": "BOLSA ABIERTA 33CM*61CM TRANS SIN IMP",
"und": 4500,
"kg": 81.0
},
{
"siesa": "5010316",
"referencia": "BOLSA AGUA EL PARAMO  6 LT CON VAL",
"und": 4500,
"kg": 112.5
},
{
"siesa": "5010260",
"referencia": "BOLSA AGUA 6 LITROS MERCACENTRO SIN VAL",
"und": 4500,
"kg": 112.5
},
{
"siesa": "5020274",
"referencia": "BOLSA VAL DURO PEGA PORCELANATO 25 KG",
"und": 4400,
"kg": 220.0
},
{
"siesa": "5010345",
"referencia": "BOLSA AB FRUTA CRISTALIZADA FLEISCH X2.5",
"und": 4400,
"kg": 52.8
},
{
"siesa": "5010415",
"referencia": "BOLSA AGUA SANTA 7 LT SIN VALV",
"und": 4350,
"kg": 108.75
},
{
"siesa": "5020273",
"referencia": "BOLSA VAL DURO PEGA CERAMIC 25 KG",
"und": 4268,
"kg": 213.4
},
{
"siesa": "5040082",
"referencia": "FLOW PACK REPARADOR CON FIBRA 25 KG",
"und": 4200,
"kg": 210.0
},
{
"siesa": "5010147",
"referencia": "BOLSA AB CONTINENTE CERAMICO GRIS 25KG",
"und": 4200,
"kg": 210.0
},
{
"siesa": "5010331",
"referencia": "BOLSA AB SUPER PLUS 25 KG",
"und": 4200,
"kg": 210.0
},
{
"siesa": "5010359",
"referencia": "BOLSA AB COCO AZUCARADO LEVAPAN X 2.5K",
"und": 4100,
"kg": 49.2
},
{
"siesa": "5010364",
"referencia": "BOLSA AB COCO AZUCARADO LEVAPAN X 1K",
"und": 4000,
"kg": 32.0
},
{
"siesa": "5020226",
"referencia": "BOLSA VALV PEGO SPLENDOR 40KG",
"und": 3805,
"kg": 304.4
},
{
"siesa": "5040088",
"referencia": "FLOW PACK WEBER MORTERO IMPERMEABLE 5 KG",
"und": 3500,
"kg": 80.5
},
{
"siesa": "5020224",
"referencia": "BOLSA VALV PEGA BOOM18 20KG",
"und": 3200,
"kg": 137.6
},
{
"siesa": "5010440",
"referencia": "BOLSA ABIERTA 43cm*65cm SIN IMP",
"und": 3100,
"kg": 161.2
},
{
"siesa": "5040081",
"referencia": "FLOW PACK MORTERO IMPERMEABLE 25 KG",
"und": 3000,
"kg": 150.0
},
{
"siesa": "5010363",
"referencia": "BOLSA AB POLVO HORNEAR COBURGOS X 2.5K",
"und": 3000,
"kg": 36.0
},
{
"siesa": "5020234",
"referencia": "BOLSA VALV 10000 EMP PEGAN PISCINAS 25KG",
"und": 2900,
"kg": 145.0
},
{
"siesa": "5020242",
"referencia": "BOLSA VALV 90000 PEGAN CERAM INT LC25KG",
"und": 2803,
"kg": 140.15
},
{
"siesa": "5040076",
"referencia": "FLOW PACK BOQUILLA HYDROLATEX 5 KG",
"und": 2650,
"kg": 63.6
},
{
"siesa": "5020009",
"referencia": "BOLSA VALV PEGO MAESTRO 25KG",
"und": 2630,
"kg": 131.5
},
{
"siesa": "5020148",
"referencia": "BOLSA VALV PEGO PISO SOBRE PISO 25KG",
"und": 2590,
"kg": 129.5
},
{
"siesa": "5010447",
"referencia": "BOLSA AB PINTECO 20 KG",
"und": 2500,
"kg": 130.0
},
{
"siesa": "5010382",
"referencia": "BOLSA AGUA MANPAOS  7 LT CON VAL",
"und": 2500,
"kg": 62.5
},
{
"siesa": "5020283",
"referencia": "BOLSA VALV TITON PABON 25 KG",
"und": 2200,
"kg": 110.0
},
{
"siesa": "5010343",
"referencia": "BOLSA AB POLVO DE HORNEAR COBURGOS X 1KG",
"und": 2200,
"kg": 17.6
},
{
"siesa": "5020108",
"referencia": "BOLSA VALVMASTIC INTERIOR PANEL-TEC 25KG",
"und": 2100,
"kg": 197.4
},
{
"siesa": "5020259",
"referencia": "BOLSA VALV CERAMIKOL 40 KG",
"und": 2050,
"kg": 164.0
},
{
"siesa": "5020240",
"referencia": "BOLSA VALV 70000 PEGAN PORCE INT GR 25KG",
"und": 2000,
"kg": 100.0
},
{
"siesa": "5010393",
"referencia": "BOLSA AGUA NUESTRA TIERRA 6 LT CON VAL",
"und": 2000,
"kg": 50.0
},
{
"siesa": "5010333",
"referencia": "BOLSA AGUA SHUI - MARVI 6LT SIN VALV.",
"und": 2000,
"kg": 50.0
},
{
"siesa": "5040077",
"referencia": "FLOW PACK FLUMUS 1 KG",
"und": 1763,
"kg": 21.156
},
{
"siesa": "5040050",
"referencia": "FLOW PACK 40000 ESTUCO RELL INT 25 KG",
"und": 1700,
"kg": 85.0
},
{
"siesa": "5040092",
"referencia": "BOLSA VALVULADA ARENA PREMIUM SAJEEM 5KG",
"und": 1600,
"kg": 83.2
},
{
"siesa": "5020286",
"referencia": "BOLSA VALV SUPERFLEX PORCELANICO 25 KG",
"und": 1495,
"kg": 74.75
},
{
"siesa": "5020280",
"referencia": "BOLSA VAL BRICO PORCELANATO 25 KG",
"und": 1450,
"kg": 72.5
},
{
"siesa": "5020239",
"referencia": "BOLSA VALV 60000 PEGAN CER EXTERIOR 25KG",
"und": 1400,
"kg": 70.0
},
{
"siesa": "5010384",
"referencia": "BOLSA AGUA BRIS 7 LT SIN VAL",
"und": 1400,
"kg": 35.0
},
{
"siesa": "5040089",
"referencia": "FLOW PACK WEBER REPARADOR CONCRETO 25 KG",
"und": 1350,
"kg": 70.2
},
{
"siesa": "5020237",
"referencia": "BOLSA VALV 40000 EMP PEGAN FACHADAS 25KG",
"und": 1341,
"kg": 67.05
},
{
"siesa": "5020051",
"referencia": "BOLSA VALV PORCELANICO INTERIOR 40KG",
"und": 1341,
"kg": 107.28
},
{
"siesa": "5010395",
"referencia": "BOLSA AGUA VITAL RIVER 6 LT CON VAL",
"und": 1250,
"kg": 31.25
},
{
"siesa": "5010456",
"referencia": "BOLSA ABIERTA ALKAFIL 12,5 KG",
"und": 1200,
"kg": 43.2
},
{
"siesa": "5020285",
"referencia": "BOLSA VALV SUPERFLEX CERAM STANDAR 25 KG",
"und": 1150,
"kg": 57.5
},
{
"siesa": "5020267",
"referencia": "BOLSA VALV BLANCA 65*34+7+7 CM",
"und": 1000,
"kg": 50.0
},
{
"siesa": "5020021",
"referencia": "BOLSA VALV TAUROQUIMICA IMP 25KG",
"und": 1000,
"kg": 10.0
},
{
"siesa": "5030058",
"referencia": "LAMINA TRANSP. TERMOENCOGIBLE 60CM*2.8",
"und": 944,
"kg": 944.0
},
{
"siesa": "5030088",
"referencia": "LAMINA TRANSP. TERMOENCOGIBLE 56 CM*3",
"und": 860,
"kg": 860.0
},
{
"siesa": "5020277",
"referencia": "BOLSA VAL CONSTRUFORT PORCE BLA 25 KG",
"und": 800,
"kg": 40.0
},
{
"siesa": "5020252",
"referencia": "BOLSA VALV 130000 EMP CAPA GRUESA 25 KG",
"und": 720,
"kg": 36.0
},
{
"siesa": "5020243",
"referencia": "BOLSA VALV 100000 EMP PEGAN RENOVA 25KG",
"und": 600,
"kg": 30.0
},
{
"siesa": "5010400",
"referencia": "BOLSA AGUA DE LA CIMA 6,5 LT CON VALV",
"und": 500,
"kg": 12.5
},
{
"siesa": "5020115",
"referencia": "BOLSA VALV CONSTRUCERA. CERAMICO 25KG",
"und": 409,
"kg": 20.45
},
{
"siesa": "5030054",
"referencia": "ROLLO STRETCH 15CM X 300MT CAL 7",
"und": 408,
"kg": 0.816
},
{
"siesa": "5020200",
"referencia": "BOLSA VALV PEGAFORTEX CERAMI BLANCO 25KG",
"und": 400,
"kg": 4.0
},
{
"siesa": "5010419",
"referencia": "BOLSA ABIERTA IMPADOC PEGAPISCINAS 25 KG",
"und": 400,
"kg": 22.8
},
{
"siesa": "5010328",
"referencia": "BOLSA AB BINDA BOQUILLA ACRILICO 10KG",
"und": 400,
"kg": 20.8
},
{
"siesa": "5030120",
"referencia": "LAMINA COCO RALLADO DESHIDRA. LEVAP. 1KG",
"und": 395,
"kg": 395.0
},
{
"siesa": "5030109",
"referencia": "656438 SIKA CERAM 630 COLOR 2KG",
"und": 382,
"kg": 382.0
},
{
"siesa": "5020018",
"referencia": "BOLSA VALV PORCELANICO INTERIOR 25KG",
"und": 377,
"kg": 18.85
},
{
"siesa": "5020081",
"referencia": "BOLSA VALV PEGO CERAMICO PREMIUM 25 KG",
"und": 350,
"kg": 17.5
},
{
"siesa": "5010319",
"referencia": "BOLSA AGUA FUENTE PURAA  6 LT SIN  VAL",
"und": 300,
"kg": 7.5
},
{
"siesa": "5020189",
"referencia": "BOLSA VALV PEGA SAN MARCOS CERAMICO 25KG",
"und": 283,
"kg": 14.15
},
{
"siesa": "5020011",
"referencia": "BOLSA VALV PEGO SPLENDOR 25KG",
"und": 280,
"kg": 14.0
},
{
"siesa": "5030125",
"referencia": "LAMINA TRANSP. CRISTALINA BRIS 250ML",
"und": 273,
"kg": 273.0
},
{
"siesa": "5030105",
"referencia": "587017 SIKA 101 MORTERO PLUS BLANCO 10KG",
"und": 264,
"kg": 264.0
},
{
"siesa": "5020266",
"referencia": "BOLSA VALV TODO COLOR 25 KG",
"und": 200,
"kg": 10.0
},
{
"siesa": "5020174",
"referencia": "BOLSA VALV MULTI. PEG. PORCELA BLAN 25KG",
"und": 200,
"kg": 10.0
},
{
"siesa": "5020058",
"referencia": "BOLSA VALV PEGO PISCINA 25KG",
"und": 200,
"kg": 10.0
},
{
"siesa": "5010281",
"referencia": "BOLSA AB REEMP 42*62CM 5KG",
"und": 174,
"kg": 9.048
},
{
"siesa": "5030113",
"referencia": "587016 SIKA 101 MORTERO PLUS GRIS 10KG",
"und": 167,
"kg": 167.0
},
{
"siesa": "5030049",
"referencia": "LAMINA TRANSP TERMOENCOGIBLE 60CM*3.5",
"und": 159,
"kg": 159.0
},
{
"siesa": "5020235",
"referencia": "BOLSA VALV 20000 PEGAN CERAM PLUS 25KG",
"und": 150,
"kg": 7.5
},
{
"siesa": "5020012",
"referencia": "BOLSA VALV PEGOPERFECTO VERDE 25KG",
"und": 149,
"kg": 7.45
},
{
"siesa": "5010348",
"referencia": "BOLSA AB FRUTA CRISTALIZADA LEVAPAN X2.5",
"und": 139,
"kg": 1.668
},
{
"siesa": "5030097",
"referencia": "742344 SIKA MORTERO IMPERMEA. BLA/3X10KG",
"und": 129,
"kg": 129.0
},
{
"siesa": "5020020",
"referencia": "BOLSA VALV SUPERPEGA 25KG",
"und": 101,
"kg": 1.01
},
{
"siesa": "5020238",
"referencia": "BOLSA VALV 50000 EMP PEGAN PORCELAN 25KG",
"und": 100,
"kg": 5.0
},
{
"siesa": "5020023",
"referencia": "BOLSA VALV TECNOPEGA 25KG",
"und": 62,
"kg": 3.1
},
{
"siesa": "5030135",
"referencia": "E. ROLLO STRETCH 30CM X 300MT CAL 7",
"und": 57,
"kg": 0.114
},
{
"siesa": "5030107",
"referencia": "610152 SIKA CERAM 650 BOQUILLA PLUS 2KG",
"und": 57,
"kg": 57.0
},
{
"siesa": "5030134",
"referencia": "E. ROLLO STRETCH 45CM X 450MT CAL 7",
"und": 48,
"kg": 0.096
},
{
"siesa": "5030140",
"referencia": "LAMINA TRANSP AGUA LIRIO AZUL 350 ML",
"und": 35,
"kg": 35.0
},
{
"siesa": "5030110",
"referencia": "587015 SIKA 101 MORTERO PLUS BLANCO 2KG",
"und": 15,
"kg": 15.0
},
{
"siesa": "5030141",
"referencia": "610152 SIKA 650 BOQUILLA PLUS BLANC 2 KG",
"und": 11,
"kg": 11.0
},
{
"siesa": "5030121",
"referencia": "LAMINA COCO RALL. CAB. DE ANGEL LEVA 1KG",
"und": 6,
"kg": 6.0
},
{
"siesa": "5020281",
"referencia": "BOLSA VAL BRICO CERAMICO 40 KG",
"und": 2,
"kg": 0.16
}
],
"ppRollos": [
{
"siesa": "5990115",
"desc": "TUBBLA42CMCAL3,8",
"kg": 495.0
},
{
"siesa": "5990182",
"desc": "SEMBLA100CMCAL1,8",
"kg": 6219.0
},
{
"siesa": "5990685",
"desc": "SEMBLA95CMCAL1.8",
"kg": 11503.0
},
{
"siesa": "5991132",
"desc": "LAMINA REEMPAQUE TRANS/BLAN/COLORES",
"kg": 2430.0
},
{
"siesa": "5990787",
"desc": "LAMTRA87CMCAL4,0",
"kg": 2038.0
},
{
"siesa": "5990993",
"desc": "LAMTRA89CMCAL4,0/4,2",
"kg": 1820.0
},
{
"siesa": "5990378",
"desc": "LAMTRA91CMCAL4,0/4,2",
"kg": 748.0
},
{
"siesa": "5990184",
"desc": "SEMBLA115CMCAL2,1",
"kg": 1863.0
},
{
"siesa": "5990673",
"desc": "SEMBLA90CMCAL1,8",
"kg": 1460.0
},
{
"siesa": "5991023",
"desc": "SEMBLA108CMCAL2,0",
"kg": 1452.0
},
{
"siesa": "5991013",
"desc": "LAMTRANS79CMCAL3,0",
"kg": 962.0
},
{
"siesa": "5990562",
"desc": "TUBBLA50CMCAL4.3",
"kg": 1082.0
},
{
"siesa": "5991145",
"desc": "LAIMP 5020226 BOL VAL PEG SPLEND 40KG",
"kg": 0.0
},
{
"siesa": "5991193",
"desc": "LAIMP 5020262 BOL VAL CONSTRU CER 25 KG",
"kg": 0.0
},
{
"siesa": "5990994",
"desc": "LAMTRA93CMCAL4,0/4,2",
"kg": 983.0
},
{
"siesa": "5990996",
"desc": "LAMTRA97CMCAL4,0/4,2",
"kg": 638.0
},
{
"siesa": "5991009",
"desc": "LAMTRA69CMCAL3,0",
"kg": 1029.0
},
{
"siesa": "5990942",
"desc": "LAMBLA83CMCAL4,0/4,3",
"kg": 0.0
},
{
"siesa": "5990524",
"desc": "SEMBLA122CMCAL2,3",
"kg": 714.0
},
{
"siesa": "5991194",
"desc": "LAIMP 5020263 BOL VAL CONSTRU POR 25 KG",
"kg": 0.0
},
{
"siesa": "5991090",
"desc": "LAIMP 05020011 BOL VAL PEG SPLEND 25KG",
"kg": 584.0
},
{
"siesa": "5990999",
"desc": "LAMBLA103CMCAL4,3/3,3",
"kg": 1152.0
},
{
"siesa": "5991011",
"desc": "LAMTRA53CMCAL3,0",
"kg": 0.0
},
{
"siesa": "5991032",
"desc": "LAMBLA79CMCAL4,3",
"kg": 342.0
},
{
"siesa": "5991035",
"desc": "LAMTRA90CMCAL2,2",
"kg": 269.0
},
{
"siesa": "5990609",
"desc": "LAMTRA83CMCAL4,0",
"kg": 406.0
},
{
"siesa": "5991030",
"desc": "LAMBLA54CMCAL4,3",
"kg": 232.0
},
{
"siesa": "5991201",
"desc": "LAIMP 5020240BOL VAL 70000PEG PORC GR25K",
"kg": 189.0
},
{
"siesa": "5991135",
"desc": "LAIMP 5020149BOL VAL ULTRACEM CER GR 25K",
"kg": 178.0
},
{
"siesa": "5991007",
"desc": "LAMTRA61CMCAL3,0",
"kg": 67.0
},
{
"siesa": "5991027",
"desc": "LAMBLA80CMCAL4,3",
"kg": 0.0
},
{
"siesa": "5991012",
"desc": "LAMBLA63CM/64CMCAL3,0/3,3/4,3",
"kg": 542.0
},
{
"siesa": "5991001",
"desc": "LAMTRA75CMCAL3,0",
"kg": 154.0
},
{
"siesa": "5991003",
"desc": "TUBBLA40CMCAL3,8/4,2",
"kg": 0.0
},
{
"siesa": "5991212",
"desc": "LAIMP 5010361 BA  FRUTA CRIST LEVA X 1K",
"kg": 0.0
},
{
"siesa": "5991074",
"desc": "LAMBLA56CMCAL4,3",
"kg": 117.0
},
{
"siesa": "5991071",
"desc": "SEMBLA72CMCAL2",
"kg": 107.0
},
{
"siesa": "5991205",
"desc": "LAMBLA81CMCAL2,9/3,0",
"kg": 0.0
}
],
"ppImpresas": [
{
"siesa": "5020169",
"referencia": "BOLSA VALV MULTICENTRO PEG. EX. CER 25KG  100CM CAL1,8",
"kg": 602.0
},
{
"siesa": "5020242",
"referencia": "BOLSA VALV 90000 EMP PEGAN CERAMI LC25KG 95CM CAL 1,8",
"kg": 410.0
},
{
"siesa": "5020257",
"referencia": "BOLSA VALV EXTRA CERAMICO 40 KG 115CM CAL 2,1",
"kg": 429.0
},
{
"siesa": "5020281",
"referencia": "BOLSA VAL BRICO CERAMICO 40 KG 115CM CAL 2,1",
"kg": 840.0
},
{
"siesa": "5020282",
"referencia": "BOLSA VAL BRICO PORCELANATO 40 KG 115CM CAL 2,1",
"kg": 524.0
},
{
"siesa": "5040021",
"referencia": "FLOW PACK BOQUILLA AMBIC 2KG LAMINA BLANCA 83CM",
"kg": 361.0
},
{
"siesa": "5010272",
"referencia": "FLOW PACK ESPLACOL BOQUILLA LATEX 2KG LAMINA BLANCA 83CM",
"kg": 329.0
},
{
"siesa": "5010351",
"referencia": "BOLSA AGUA COPOS 6LT SIN VAL 87CM CAL 4",
"kg": 649.0
}
]
};
