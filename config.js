window.APP_CONFIG = {
  siteTitle: "Jimmy's Dashboard",
  siteSubtitle: "Gold and silver in AUD, with live cameras in Australia, Iran and the USA",

  symbols: {
    gold: "OANDA:XAUAUD",
    silver: "OANDA:XAGAUD"
  },

  cameras: {
    australia: [
      /*
      Example YouTube live stream:
      {
        title: "Sydney Harbour",
        type: "youtube",
        id: "YOUTUBE_VIDEO_ID",
        note: "Use only a live stream that you have tested and that permits embedding."
      }

      Example direct iframe source:
      {
        title: "Sydney CBD",
        type: "iframe",
        src: "https://provider.example/embed/camera123",
        note: "Use only provider URLs that explicitly allow embedding."
      }
      */
    ],
    iran: [
      /*
      Iran embeds are often less stable and harder to source reliably.
      Add only tested embeddable sources here.
      */
    ],
    usa: [
      /*
      Example:
      {
        title: "Times Square",
        type: "youtube",
        id: "YOUTUBE_VIDEO_ID",
        note: "Use only a tested embeddable stream."
      }
      */
    ]
  }
};
