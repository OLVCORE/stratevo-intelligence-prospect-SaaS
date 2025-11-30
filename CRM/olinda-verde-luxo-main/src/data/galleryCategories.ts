// ============= Galeria Premium do Espaço Olinda =============
// 178 imagens reais categorizadas por conteúdo visual

export interface GalleryImage {
  src: string;
  alt: string;
  category: string;
  featured?: boolean;
}

export const galleryCategories = {
  destaques: {
    title: "Momentos Inesquecíveis",
    description: "As celebrações e momentos mais marcantes do Espaço Olinda",
    icon: "Sparkles",
    images: [
      "/galeria/espacoolinda/1punqxUhlZjv923olUOSSsSIMgGkIVctq.jpg",
      "/galeria/espacoolinda/13yza05PuQsZe63siMqU6hxibWTt8U65f.jpg",
      "/galeria/espacoolinda/1bioQ7JsmcRBcU-uueQ8gFWRulscPM1AE.jpg",
      "/galeria/espacoolinda/1epGhwTaywkOBdMwvhXrTw0xyTjkCCXiZ.jpg",
      "/galeria/espacoolinda/1Wk7UzKRbPJlTuzXcc3hnBmNqkUQgGBHC.jpg",
      "/galeria/espacoolinda/1ThnarWxz5EyCuKGaZhCCgvHsa0EJm1FE.jpg",
      "/galeria/espacoolinda/10T5LEO_2zBzB8ALe0c9A36DMKeQnQGiZ.jpg",
      "/galeria/espacoolinda/1FomSThQp6Ohpex0sGXnJ0_mtImPyRyc9.jpg",
      "/galeria/espacoolinda/19Y9uXIs2g3iDqHbvTnRaovblzVR5weZv.jpg",
      "/galeria/espacoolinda/1WkmUYYsrZW8r_ROP50FqiETEOuLCKMZp.jpg",
      "/galeria/espacoolinda/1AMMASIdfoNuWQZsf7OhyCEh6E3YpE_1R.jpg",
      "/galeria/espacoolinda/1j5fBx3hSEmgyUY8LwD9gDsmaBjVaD8_K.jpg",
      "/galeria/espacoolinda/1xD2p82sf3UFohUXK1OjEgXnOuBRtYlSE.jpg",
      "/galeria/espacoolinda/1b23DL5LvI4lttAO2h_GDEjTd68plW-Id.jpg",
      "/galeria/espacoolinda/1V7ok7eYyl9_ONFMZwFANv711D5aOlN_c.jpg",
      "/galeria/espacoolinda/1ruMLTdX2yEoRS-5nMAknU79r9glY6z6v.jpg",
      "/galeria/espacoolinda/1jrG0t4s01guwfWu11Fi95V076fX4Z0yc.jpg",
      "/galeria/espacoolinda/1wJH9umvBNNXtAIiOO7l2tlmxu6uWMKU0.jpg",
      "/galeria/espacoolinda/1r1YWqrCrLNQtEdtMoGw0D8TwEbmXXsoQ.jpg",
      "/galeria/espacoolinda/1G8CiY3BGgFYomGPb89WNFlt2KWrmpSz_.jpg",
      "/galeria/espacoolinda/12lL8_GfEggvaJbq7M2tW3dPC3bfs4pMc.jpg",
      "/galeria/espacoolinda/1JVLYFOKtoUn-8_tziArt-GULvokX8Ej2.jpg",
      "/galeria/espacoolinda/1BG_OZN1hz3oIVE10N05HojK3LVyfPAnt.jpg",
      "/galeria/espacoolinda/1pbO78hr9XfXgqoruwNXg7O73h1fdvAUm.jpg",
    ]
  },
  
  eventos: {
    title: "Eventos & Celebrações",
    description: "Cerimônias, festas e eventos memoráveis realizados no espaço",
    icon: "PartyPopper",
    images: [
      "/galeria/espacoolinda/13yza05PuQsZe63siMqU6hxibWTt8U65f.jpg",
      "/galeria/espacoolinda/10T5LEO_2zBzB8ALe0c9A36DMKeQnQGiZ.jpg",
      "/galeria/espacoolinda/1bioQ7JsmcRBcU-uueQ8gFWRulscPM1AE.jpg",
      "/galeria/espacoolinda/1FomSThQp6Ohpex0sGXnJ0_mtImPyRyc9.jpg",
      "/galeria/espacoolinda/19Y9uXIs2g3iDqHbvTnRaovblzVR5weZv.jpg",
      "/galeria/espacoolinda/1q7Q2OURG2zzV69cWv5m7KM2BQ5DRBp-i.jpg",
      "/galeria/espacoolinda/1ZdBbMR9EX5cMIVP73enjBNYkvm-J2lUx.jpg",
      "/galeria/espacoolinda/14JGaL6x_-0LkbZM_5HJ8gAWnS17md6C2.jpg",
      "/galeria/espacoolinda/1aZlEVgedltE9RRSr3EOsnuw9up7nxu19.jpg",
      "/galeria/espacoolinda/1xkFwa5eD2tHl1RzoKlCutYl7rcrssG5-.jpg",
      "/galeria/espacoolinda/1GKk2BCTcXG2vLvtlC7V78FinisvzX8xQ.jpg",
      "/galeria/espacoolinda/1rUdBcFP2Hetb9fii2fpEz-96EUCJUspF.jpg",
      "/galeria/espacoolinda/1tXXJPBGzATKfaLiNAIePHKjwlvVUJ4QH.jpg",
      "/galeria/espacoolinda/124ZzI-D5fxdrn_Ux8ASz_d4PbV0p9lAz.jpg",
      "/galeria/espacoolinda/1w2mgTQvuWgZRHqbsRRfjFoCBQeKOWcUy.jpg",
      "/galeria/espacoolinda/1F9RtC88aLdT_MFMhkXwbzamiQFyEmZ5i.jpg",
      "/galeria/espacoolinda/1vcvt-itFViHTtoM_3BCaYOuHMSUezVYV.jpg",
      "/galeria/espacoolinda/1Yt_YlV8rUN02rVd89RF1LqWoreM1KKTu.jpg",
      "/galeria/espacoolinda/1EpzxHHw72lBhCS5NW4R5yvepa_ExHoMG.jpg",
      "/galeria/espacoolinda/1AvusmUSuw3UeGtF2vdocmPwsV2DLqpOS.jpg",
      "/galeria/espacoolinda/1BK3rnnRaz1XLdw1BnMacl201B3RbWmTz.jpg",
      "/galeria/espacoolinda/1e1Nr97LtyYTMNobh8iY69uTTGPSdtFLu.jpg",
      "/galeria/espacoolinda/18s2Hj7RP6vVSOGlYsqCk9dlWFerCVSdx.jpg",
      "/galeria/espacoolinda/1Ga-tWfpWo5AqKnGOgqbrUjgc67W8RN27.jpg",
      "/galeria/espacoolinda/1b7wRrhPce1BXtwNKrOCG2yDT0ugyr9ab.jpg",
      "/galeria/espacoolinda/1fiKoxRWUp119iJ4WkjQIHyr2xQAEH3C3.jpg",
      "/galeria/espacoolinda/1JA4Myg49hzjZ5Kqe2QazrPLRRWRUeaRy.jpg",
      "/galeria/espacoolinda/1SkLmoHPiftYT_jt-MtAD20zBxFFuTZVN.jpg",
      "/galeria/espacoolinda/1TcT_YFMT1Epv1gvYa06VEf_G2s9U1phh.jpg",
      "/galeria/espacoolinda/1Ag0rowLqbvsSTIKpwYxQ7A-WfBzmAo-P.jpg",
    ]
  },

  jardins: {
    title: "Jardins & Paisagismo",
    description: "Natureza exuberante e paisagismo premium",
    icon: "TreePine",
    images: [
      "/galeria/espacoolinda/1xD2p82sf3UFohUXK1OjEgXnOuBRtYlSE.jpg",
      "/galeria/espacoolinda/1b23DL5LvI4lttAO2h_GDEjTd68plW-Id.jpg",
      "/galeria/espacoolinda/1V7ok7eYyl9_ONFMZwFANv711D5aOlN_c.jpg",
      "/galeria/espacoolinda/1ruMLTdX2yEoRS-5nMAknU79r9glY6z6v.jpg",
      "/galeria/espacoolinda/124ZzI-D5fxdrn_Ux8ASz_d4PbV0p9lAz.jpg",
      "/galeria/espacoolinda/1w2mgTQvuWgZRHqbsRRfjFoCBQeKOWcUy.jpg",
      "/galeria/espacoolinda/1F9RtC88aLdT_MFMhkXwbzamiQFyEmZ5i.jpg",
      "/galeria/espacoolinda/1tXDoXTri6AUeBvn3RSUdaMdzH_ifNEGl.jpg",
      "/galeria/espacoolinda/1nFOnridFcXF-8WtZ7wEgRhbk7PI9Iy67.jpg",
      "/galeria/espacoolinda/1rRaVNGBJ9duQIFhF9uS4eJeANo6UJRJD.jpg",
      "/galeria/espacoolinda/1MFGDlRCNBOL9_XQBFC4x5QaluUnHkJtP.jpg",
      "/galeria/espacoolinda/1GRBcMLgeQZe918yNlRXawKgtT5L_hbB9.jpg",
      "/galeria/espacoolinda/1tc55y3u4N1RhgX0XEnIBT2ENNk-zqeQ1.jpg",
      "/galeria/espacoolinda/1rr0o4nw-z_HphrxUQmB0dXHN3YtZsKHZ.jpg",
      "/galeria/espacoolinda/1dzv6Kea00SnaqH-iCb6T_n_YYUqaccGX.jpg",
      "/galeria/espacoolinda/1hOEhDA-7Mg-I_Qv3CNfJTDSxfJfB_Jem.jpg",
      "/galeria/espacoolinda/1yQiZ67CnZqDmhFmAktDClSDrSnc3smdl.jpg",
      "/galeria/espacoolinda/1_-abVMsE9fTF6oWr6rqEABDdcpfLP2Qe.jpg",
      "/galeria/espacoolinda/1AmU-4BywemMvTndd3MLl5JKioVbTF3hN.jpg",
      "/galeria/espacoolinda/1oJ7o6g6oYeFbAGnuOCD_Sp_amEjXfolD.jpg",
      "/galeria/espacoolinda/1yeP_ocUPDqjUVPzcfAL5xlEkOmV5I7RA.jpg",
      "/galeria/espacoolinda/1vnXET6a23AyYDqLHbvn9dYK1Tnh8Lwpw.jpg",
      "/galeria/espacoolinda/1gGMorSqzzxDQ1EYLfyqwT3JU94-C9Zon.jpg",
      "/galeria/espacoolinda/16Jzp3XWB6qLlhyJCWsA7mSBjrGrx1Si6.jpg",
      "/galeria/espacoolinda/1gEzGV3uTm1Q51WgplvkTeKZxahLXRi82.jpg",
      "/galeria/espacoolinda/1X5-XJU5b6QlGG8K11LjYGWo7mxPobKpy.jpg",
      "/galeria/espacoolinda/1J3ekW2Z70O-zoWXbRw2GfaPPMSpnZxut.jpg",
      "/galeria/espacoolinda/1xN7vlSISvRznOx6HdxDnhxJ8qcACqMON.jpg",
      "/galeria/espacoolinda/1D9D_BMwFlrJbYtpMkUktkDw6Ap3qMEN4.jpg",
      "/galeria/espacoolinda/1F5m0RIlPlTNBVfMfXXZyZ43oPnV1sMLB.jpg",
    ]
  },

  piscina: {
    title: "Piscina & Área de Lazer",
    description: "Momentos de relaxamento e diversão",
    icon: "Waves",
    images: [
      "/galeria/espacoolinda/1epGhwTaywkOBdMwvhXrTw0xyTjkCCXiZ.jpg",
      "/galeria/espacoolinda/1jrG0t4s01guwfWu11Fi95V076fX4Z0yc.jpg",
      "/galeria/espacoolinda/1wJH9umvBNNXtAIiOO7l2tlmxu6uWMKU0.jpg",
      "/galeria/espacoolinda/1r1YWqrCrLNQtEdtMoGw0D8TwEbmXXsoQ.jpg",
      "/galeria/espacoolinda/1vcvt-itFViHTtoM_3BCaYOuHMSUezVYV.jpg",
      "/galeria/espacoolinda/1Yt_YlV8rUN02rVd89RF1LqWoreM1KKTu.jpg",
      "/galeria/espacoolinda/1EpzxHHw72lBhCS5NW4R5yvepa_ExHoMG.jpg",
      "/galeria/espacoolinda/1AvusmUSuw3UeGtF2vdocmPwsV2DLqpOS.jpg",
      "/galeria/espacoolinda/1iP51WLM0_45VqA26ALnYQdDA2P5LxHCV.jpg",
      "/galeria/espacoolinda/1Js3kx9hrSsZCWe1vx24j5huAsqrSzkwj.jpg",
      "/galeria/espacoolinda/1NpT64HiAu_koaFWCZp-MqC73MULgkPWA.jpg",
      "/galeria/espacoolinda/1zJPIUgw_gv54MlU5fe9hJS0amfPDfeVK.jpg",
      "/galeria/espacoolinda/1pJUteNuiqaxdTg-OYhzw6JrcXP7i4auc.jpg",
      "/galeria/espacoolinda/1Wm0QMu51YMI2tKeyZeAoWQ70UXgt2ueh.jpg",
      "/galeria/espacoolinda/1fRHpSl04qdBdHd1uqCxi9Jo0wCNtTUFM.jpg",
      "/galeria/espacoolinda/1Uaiyz5pDJkaf-CMHn5WvJQK7Qmk-2r1S.jpg",
      "/galeria/espacoolinda/10mw6s-YG1NcUz04lyuSzesqDda6wN-ah.jpg",
      "/galeria/espacoolinda/1SsBk0-k9cOyYCfLYT2DEzG8BHcwlCcGK.jpg",
      "/galeria/espacoolinda/1c8t9_1a1_3_JZAYq4f-6lms8Cxq-f8Xe.jpg",
      "/galeria/espacoolinda/1fV_Irh0jICH1eexmS029eJh5a30Ul3Ut.jpg",
      "/galeria/espacoolinda/19oDy-T95Ny_BA7yNsxmUpu7T9gJ9LuU7.jpg",
      "/galeria/espacoolinda/16hr_ishaHbzea5WZFSUhQkpSOPYSFk1P.jpg",
      "/galeria/espacoolinda/15tbOTLo8ctba2xlFwlV-dnRr_JnNoxJQ.jpg",
      "/galeria/espacoolinda/1UpdhCKP2HsymJH512GmpivPD620v6GRv.jpg",
    ]
  },

  infraestrutura: {
    title: "Infraestrutura Completa",
    description: "Espaços, salões e comodidades premium",
    icon: "Building",
    images: [
      "/galeria/espacoolinda/1Wk7UzKRbPJlTuzXcc3hnBmNqkUQgGBHC.jpg",
      "/galeria/espacoolinda/1G8CiY3BGgFYomGPb89WNFlt2KWrmpSz_.jpg",
      "/galeria/espacoolinda/12lL8_GfEggvaJbq7M2tW3dPC3bfs4pMc.jpg",
      "/galeria/espacoolinda/1JVLYFOKtoUn-8_tziArt-GULvokX8Ej2.jpg",
      "/galeria/espacoolinda/1BK3rnnRaz1XLdw1BnMacl201B3RbWmTz.jpg",
      "/galeria/espacoolinda/1e1Nr97LtyYTMNobh8iY69uTTGPSdtFLu.jpg",
      "/galeria/espacoolinda/18s2Hj7RP6vVSOGlYsqCk9dlWFerCVSdx.jpg",
      "/galeria/espacoolinda/1Ga-tWfpWo5AqKnGOgqbrUjgc67W8RN27.jpg",
      "/galeria/espacoolinda/1dg9MFUPlfj9TSP3CHVJaAGnfn9ItwROB.jpg",
      "/galeria/espacoolinda/1i_0UJoczr2OgtugpLoMJ5-Z31tKx7Kww.jpg",
      "/galeria/espacoolinda/1s2_lCsM1j8sTMnmgUTIFS43Enm2avtmU.jpg",
      "/galeria/espacoolinda/1eIVBrQ73u_Vdla3GmZnjSfg8O8AYnb7P.jpg",
      "/galeria/espacoolinda/13Ds47d12T2vffW-U7Wwyz2aK02RxFAey.jpg",
      "/galeria/espacoolinda/1iLFu4T-Q6NzA5Be8cMzfPsh6QRUJu13g.jpg",
      "/galeria/espacoolinda/1io31s9AS7_hgWexLsDJVyhspEv9nMiUA.jpg",
      "/galeria/espacoolinda/1bgT0wpfvBoMhruhMB0For9bEJXpYgoKf.jpg",
      "/galeria/espacoolinda/14YgteT66h710_B8FLRECAkJhe7gaq_gP.jpg",
      "/galeria/espacoolinda/1Ha63YPv34JGWGxsWp22-OaGZh78Nx0Sx.jpg",
      "/galeria/espacoolinda/1JOs6SpCieIHrpCnYXdb7-HJAM5n6IASD.jpg",
      "/galeria/espacoolinda/1Ysog-hUEyi19QBNexvo5kemj-SmOWfRC.jpg",
      "/galeria/espacoolinda/19sFW7V0g8O7Mb9_t4nRVHXDEKs2y5jrm.jpg",
      "/galeria/espacoolinda/18UEzlsNbS1QlPsr6QOA5nHXGsg2H4Lbp.jpg",
      "/galeria/espacoolinda/1fUP-RMG5jOUE0Y2G_FlA4JKueO48PRVy.jpg",
      "/galeria/espacoolinda/1JBPbc5sF5Z46XDKSxmcLgeTp4tuHuw8Q.jpg",
      "/galeria/espacoolinda/1fFTVDmoqqfe_Z5AtXFKoX0TspU6Xnsuy.jpg",
      "/galeria/espacoolinda/1dnc-fK8AiUJ3AJtw3BBsTNrvMpb-tnrQ.jpg",
      "/galeria/espacoolinda/1JsGNbD1O8V0LF8S7shlgQQQ9gn3XQb2-.jpg",
      "/galeria/espacoolinda/1HW_IOBP-x2jPumHNJfOeoEvDM8ZHVKbM.jpg",
      "/galeria/espacoolinda/1Trpv_CGIAcVh9-xuWF5akz_KErTCDeiq.jpg",
      "/galeria/espacoolinda/1_kA8v7y6Nj09IkPUp8iHVBSa2c4PkaiP.jpg",
      "/galeria/espacoolinda/1Gi6bPsuQbe8DTbXx5wj-AW5peG7GAdgb.jpg",
      "/galeria/espacoolinda/1XF9bkHl7Uj5dvTLvUY1ac6mxy6iPNCGf.jpg",
      "/galeria/espacoolinda/14PVE7-Ja0XMUzjnO0hhUA694YvhHMRLm.jpg",
      "/galeria/espacoolinda/13vh-gMI07dCxgSDytn7ufKBiqSG8Yrvr.jpg",
    ]
  },

  detalhes: {
    title: "Detalhes & Decorações",
    description: "Decorações, mesas e acabamentos que fazem a diferença",
    icon: "Gem",
    images: [
      "/galeria/espacoolinda/1BG_OZN1hz3oIVE10N05HojK3LVyfPAnt.jpg",
      "/galeria/espacoolinda/1pbO78hr9XfXgqoruwNXg7O73h1fdvAUm.jpg",
      "/galeria/espacoolinda/1ThnarWxz5EyCuKGaZhCCgvHsa0EJm1FE.jpg",
      "/galeria/espacoolinda/1punqxUhlZjv923olUOSSsSIMgGkIVctq.jpg",
      "/galeria/espacoolinda/1b7wRrhPce1BXtwNKrOCG2yDT0ugyr9ab.jpg",
      "/galeria/espacoolinda/1fiKoxRWUp119iJ4WkjQIHyr2xQAEH3C3.jpg",
      "/galeria/espacoolinda/1OoDbv5A8uNbIZCuP7I3aYIHpv8u1HrFk.jpg",
      "/galeria/espacoolinda/1x-2PtGdWhKnumgCzsf4-rCacN4uf1SIG.jpg",
      "/galeria/espacoolinda/1dqnPDGlfvFMUXKgowLaQj7kApC2w6gm5.jpg",
      "/galeria/espacoolinda/1xig4rOZf-aBu_GQExchEz808ysPclUT2.jpg",
      "/galeria/espacoolinda/1aDbGlcCt79ePUv837j_cITvqJ7u1b7MI.jpg",
      "/galeria/espacoolinda/1pxqsNVMm2leHgtoWsz982C2VuDp8czPH.jpg",
      "/galeria/espacoolinda/17IVcGdPZKkqVxr26a_syiigN1meSANg4.jpg",
      "/galeria/espacoolinda/13kSdfE2fUMfu-p2WoUV06akcnR4bbdcS.jpg",
      "/galeria/espacoolinda/1-yeBABbwCDOg_l8WEODdXu8ggiQuQU7V.jpg",
      "/galeria/espacoolinda/1qw0ep3US9B-EFyLbxpwEsy0oDocsklVI.jpg",
      "/galeria/espacoolinda/1RfGLACdRf1jam1yM_q2H4cy8Av3wPSZc.jpg",
    ]
  }
};

// TOP 12 imagens para o carrossel da homepage
export const featuredImages = [
  {
    src: "/galeria/espacoolinda/2794495467876746762.jpg",
    alt: "Vista panorâmica do Espaço Olinda - eventos premium",
    title: "Celebrações Inesquecíveis"
  },
  {
    src: "/galeria/espacoolinda/3118717880346610416.jpg",
    alt: "Cerimônia de casamento ao pôr do sol - pérgola decorada",
    title: "Seu Sim ao Entardecer"
  },
  {
    src: "/galeria/espacoolinda/3121376564449184203.jpg",
    alt: "Jardins exuberantes com flores tropicais",
    title: "Natureza Exuberante"
  },
  {
    src: "/galeria/espacoolinda/2771481157437074657.jpg",
    alt: "Vista aérea noturna do Espaço Olinda iluminado",
    title: "Magia à Noite"
  },
  {
    src: "/galeria/espacoolinda/2805637847593993516.jpg",
    alt: "Piscina cristalina e área de lazer completa",
    title: "Lazer & Natureza"
  },
  {
    src: "/galeria/espacoolinda/2791074071863364806.jpg",
    alt: "Casal de noivos sob chuva de pétalas - momento mágico",
    title: "Momentos de Pura Magia"
  },
  {
    src: "/galeria/espacoolinda/3124278169997802630.jpg",
    alt: "Mesa decorada para jantar premium ao ar livre",
    title: "Jantar Sob as Estrelas"
  },
  {
    src: "/galeria/espacoolinda/3125748337739371906.jpg",
    alt: "Suíte premium com banheira de hidromassagem",
    title: "Conforto Absoluto"
  },
  {
    src: "/galeria/espacoolinda/2800371599708720456.jpg",
    alt: "Evento e celebração no Espaço Olinda",
    title: "Eventos Memoráveis"
  },
  {
    src: "/galeria/espacoolinda/2803984202892634649.jpg",
    alt: "Decoração sofisticada e detalhes premium",
    title: "Cada Detalhe Importa"
  },
  {
    src: "/galeria/espacoolinda/2776614092012233251.jpg",
    alt: "Cerimônia ao ar livre decorada",
    title: "Cerimônias Perfeitas"
  },
  {
    src: "/galeria/espacoolinda/3110024229902958642.jpg",
    alt: "Celebração especial no Espaço Olinda",
    title: "Momentos Especiais"
  }
];

/* Absolutiza caminhos para garantir carregamento imediato (sem depender de LFS) */
/* Caminhos locais mantidos como estão (sem absolutizar) */
const CDN_BASE = "";
const absolutize = (path: string) => path;

Object.values(galleryCategories).forEach((cat: { images: string[] }) => {
  cat.images = cat.images.map(absolutize);
});

featuredImages.forEach((img) => {
  img.src = absolutize(img.src);
});

// Todas as categorias para navegação
export const categoryList = [
  { id: 'destaques', name: 'Momentos Inesquecíveis', icon: 'Sparkles' },
  { id: 'eventos', name: 'Eventos & Celebrações', icon: 'PartyPopper' },
  { id: 'jardins', name: 'Jardins & Paisagismo', icon: 'TreePine' },
  { id: 'piscina', name: 'Piscina & Lazer', icon: 'Waves' },
  { id: 'infraestrutura', name: 'Infraestrutura', icon: 'Building' },
  { id: 'detalhes', name: 'Detalhes & Decorações', icon: 'Gem' },
];
