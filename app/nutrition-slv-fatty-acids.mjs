import { SLV_SOURCE } from "./nutrition-slv-core.mjs?v=190";

function fattyAcidProfile(catalogId, slvFoodNumber, officialName, omega3, omega6, note = "") {
  return Object.freeze({
    catalogId,
    slvFoodNumber,
    officialName,
    omega3,
    omega6,
    source: SLV_SOURCE,
    note,
  });
}

// Fatty-acid-only LD matches. These supplement existing canonical records
// without replacing product-label macros or existing electrolyte assumptions.
export const SLV_FATTY_ACID_PROFILES = Object.freeze([
  fattyAcidProfile("hellmanns-majonnas", 2189, "Rapsolja", 6.7, 14.9, "Beräknad profil: produktens 79 g fett/100 g multiplicerat med LD:s rapsoljeprofil (O-3 8,5 g och O-6 18,8 g/100 g olja). Äggulans mindre fettandel kan ge en liten avvikelse."),
  fattyAcidProfile("grekisk-yoghurt-10", 6113, "Yoghurt naturell fett 10%", 0.1, 0.3, "Fettsyreprofil från närliggande 10%-yoghurtpost; produktens etikettmakron behålls."),
  fattyAcidProfile("vispgradde-40", 1715, "Vispgrädde fett 40%", 0.3, 0.6, "Fettsyreprofil från motsvarande vispgräddepost; produktens etikettmakron behålls."),
  fattyAcidProfile("vispgradde-36", 1715, "Vispgrädde fett 40%", 0.3, 0.5, "Beräknad profil: Livsmedelsverkets vispgrädde 40% viktad till produktens 36 g fett; produktens etikettmakron behålls."),
  fattyAcidProfile("farskost-etikett", 107, "Färskost cream cheese fett 27%", 0.2, 0.6, "Fettsyreprofil från närliggande cream cheese-post; produktens etikettmakron behålls."),
  fattyAcidProfile("fetaost-proxy", 94, "Salladsost fett 22%", 0.2, 0.8, "Fettsyreprofil från närliggande salladsostpost; fetaostens synliga schablonmakron behålls."),
  fattyAcidProfile("kalamataoliver-etikett", 402, "Oliver svarta m. olja avrunna", 0.2, 1.8, "Beräknad profil: produktens 28,7 g fett/100 g viktat med LD:s profil för avrunna svarta oliver med olja (O-3 0,1 g och O-6 0,9 g vid 14,1 g fett). Etikettens makron och salt behålls."),
  fattyAcidProfile("halloumi-zeta", 100, "Ost halloumi rå fett 22%", 0.1, 0.6, "Fettsyreprofil från motsvarande generiska halloumipost; produktens deklarerade makron behålls."),
  fattyAcidProfile("ica-makrill-tomatsas", 1296, "Makrill filé i tomatsås konserv.", 2.6, 0.7, "Fettsyreprofil från motsvarande konserverad LD-post; produktens deklarerade makron behålls."),
  fattyAcidProfile("ica-tonfisk-i-vatten", 1278, "Tonfisk i vatten konserv. avrunnen", 0.2, 0, "Fettsyreprofil från motsvarande konserverad LD-post; produktens deklarerade makron behålls."),
  fattyAcidProfile("valnotter-proxy", 1576, "Valnötter", 8.5, 37.7),
  fattyAcidProfile("cashewnotter", 1557, "Cashewnötter rostade u. salt", 0.3, 8.9, "Fettsyreprofil från generisk osaltad cashewpost; schablonmakron behålls."),
  fattyAcidProfile("jordnotter", 1560, "Jordnötter torkade", 0, 15.5, "Fettsyreprofil från generisk osaltad jordnötspost; schablonmakron behålls."),
  fattyAcidProfile("bjornbar-proxy", 554, "Björnbär", 0, 0.1),
  fattyAcidProfile("roda-vinbar-proxy", 585, "Vinbär röda", 0, 0),
  fattyAcidProfile("falukorv-proxy", 1488, "Korv falukorv kött 58%", 0.1, 1.5),
  fattyAcidProfile("salami-proxy", 1498, "Påläggskorv salami rökt", 0.3, 3.5),
  fattyAcidProfile("linfron-proxy", 1567, "Linfrö hela", 24.2, 6.3),
  fattyAcidProfile("pesto", 2003, "Pesto hemlagad", 0.7, 7.4, "Fettsyreprofil från generisk pestopost; recept kan variera."),
  fattyAcidProfile("kaviar", 1378, "Påläggskaviar original", 3.3, 6),
  fattyAcidProfile("creme-fraiche", 1719, "Creme fraiche fett 34%", 0.2, 0.5),
  fattyAcidProfile("graddfil", 1713, "Gräddfil fett 12%", 0.1, 0.3),
  fattyAcidProfile("keso", 70, "Färskost cottage cheese naturell fett 4%", 0, 0.1),
  fattyAcidProfile("brie", 98, "Vitmögelost brie fett 30%", 0.2, 0.8),
  fattyAcidProfile("mozzarella", 2255, "Ost mozzarella fett 18%", 0.1, 0.5),
  fattyAcidProfile("entrecote", 960, "Nöt entrecote rå", 0, 0.2),
  fattyAcidProfile("flaskfile", 970, "Gris fläskfilé rå", 0, 0.2),
  fattyAcidProfile("laxfile", 1255, "Lax odlad Norge fjordlax rå", 1.8, 1.9),
  fattyAcidProfile("torsk", 1246, "Torsk rå", 0.2, 0),
  fattyAcidProfile("rakor", 1395, "Räka kokt", 0.2, 0),
  fattyAcidProfile("vitkal", 370, "Vitkål", 0, 0),
  fattyAcidProfile("broccoli", 325, "Broccoli", 0.2, 0.1),
  fattyAcidProfile("blomkal", 322, "Blomkål", 0, 0),
  fattyAcidProfile("svamp", 333, "Champinjon", 0, 0),
  fattyAcidProfile("pumpakarnor", 1571, "Pumpafrö", 0, 22.2),
  fattyAcidProfile("mandel", 1575, "Sötmandel", 0, 11.6),
  fattyAcidProfile("solrosfron", 1574, "Solrosfrö", 0, 30.1),
  fattyAcidProfile("macadamia", 7024, "Macadamianötter", 0.2, 1.3),
  fattyAcidProfile("hallon", 523, "Hallon", 0.2, 0.2),
  fattyAcidProfile("blabar", 555, "Blåbär", 0.3, 0.2),
  fattyAcidProfile("kaffe", 1957, "Kaffe bryggt", 0, 0),
  fattyAcidProfile("hjortron", 525, "Hjortron", 0.3, 0.3),
  fattyAcidProfile("apple", 588, "Äpple med skal", 0, 0),
  fattyAcidProfile("apelsin", 551, "Apelsin", 0, 0),
  fattyAcidProfile("ketchup-vanlig", 1969, "Ketchup", 0, 0),
  fattyAcidProfile("lattol", 1901, "Öl lättöl vol. % 2,3", 0, 0),
]);

export function fattyAcidProfileFor(catalogId) {
  return SLV_FATTY_ACID_PROFILES.find((profile) => profile.catalogId === catalogId) || null;
}
