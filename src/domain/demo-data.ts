import type { Project, ProductWithProfile } from "./types";

export const demoProject: Project = {
  id: "project-midea-overseas-demo",
  name: "Midea Overseas Product Marketing Demo",
  status: "ready",
  productIds: ["product-space-master", "product-mega-oven"],
  targetCountries: ["Mexico", "Brazil", "Saudi Arabia"],
  targetLanguages: ["English", "Spanish", "Portuguese"],
  createdAt: "2026-07-07T00:00:00.000Z"
};

export const demoProducts: ProductWithProfile[] = [
  {
    id: "product-space-master",
    projectId: demoProject.id,
    category: "Large appliance",
    brand: "Midea",
    modelName: "BCD-640",
    displayName: "SPACE Master BCD-640",
    profileId: "profile-space-master",
    acceptsUserUploads: true,
    assets: [
      {
        id: "asset-space-master-front",
        projectId: demoProject.id,
        productId: "product-space-master",
        type: "product-photo",
        filename: "space-master-front.png",
        url: "/demo-assets/space-master-front.png",
        source: "demo-seed"
      },
      {
        id: "asset-space-master-brand-guide",
        projectId: demoProject.id,
        productId: "product-space-master",
        type: "brand-guide",
        filename: "midea-brand-guide.pdf",
        url: "/demo-assets/midea-brand-guide.pdf",
        source: "demo-seed"
      }
    ],
    profile: {
      id: "profile-space-master",
      productId: "product-space-master",
      category: "Large appliance",
      brandSlogan: "Make yourself at home",
      targetAudience: "Young families and couples that need ample storage space",
      valueProposition: "Largest volume rate on market and segment",
      localizationHints: [
        "Prioritize capacity and space efficiency for Mexico",
        "Keep claims tied to technical proof",
        "Avoid changing product form factor in generated images"
      ],
      confidence: 0.92,
      detectedFeatures: [
        {
          id: "feature-capacity",
          title: "Large Capacity",
          shortLabel: "640L Capacity",
          benefit:
            "Large space to store food and maximize use of every corner for family needs.",
          technicalProof: "23 cu.ft. / 640L, with 434L refrigerator and 206L freezer zones.",
          priority: 1,
          sourceAssetId: "asset-space-master-front"
        },
        {
          id: "feature-slot-in",
          title: "Slot-in Look",
          shortLabel: "Counter Depth Optimization",
          benefit:
            "Occupies less kitchen space while providing a seamless built-in appearance.",
          technicalProof: "Reduced depth supports flush alignment with cabinetry.",
          priority: 2,
          sourceAssetId: "asset-space-master-front"
        },
        {
          id: "feature-low-noise",
          title: "Low Noise Inverter",
          shortLabel: "39dB Low Noise",
          benefit:
            "Keeps daily life peaceful during conversations, work, rest, and sleep.",
          technicalProof: "39dB low-noise inverter cooling.",
          priority: 3,
          sourceAssetId: "asset-space-master-front"
        },
        {
          id: "feature-energy",
          title: "Quattro Energy Saving",
          shortLabel: "Energy Saving",
          benefit:
            "Reduces electricity costs while meeting strict local energy regulations.",
          technicalProof: "Delivers 10% greater energy efficiency than the mandatory standard.",
          priority: 4,
          sourceAssetId: "asset-space-master-front"
        }
      ]
    }
  },
  {
    id: "product-mega-oven",
    projectId: demoProject.id,
    category: "Cooking appliance",
    brand: "Midea",
    modelName: "20TMG4G081",
    displayName: "MEGA SERIES 2.0 Freestanding Oven",
    profileId: "profile-mega-oven",
    acceptsUserUploads: true,
    assets: [
      {
        id: "asset-mega-oven-front",
        projectId: demoProject.id,
        productId: "product-mega-oven",
        type: "product-photo",
        filename: "mega-oven-front.png",
        url: "/demo-assets/mega-oven-front.png",
        source: "demo-seed"
      }
    ],
    profile: {
      id: "profile-mega-oven",
      productId: "product-mega-oven",
      category: "Cooking appliance",
      brandSlogan: "XpressFlame 2.0 Freestanding Oven",
      targetAudience: "Home cooks who want faster, larger, and safer cooking",
      valueProposition: "Fast heating, larger cooking area, and easy-clean safety design",
      localizationHints: [
        "Use cooking speed and energy proof for retail POP",
        "Keep burner and knob layout visually consistent"
      ],
      confidence: 0.88,
      detectedFeatures: [
        {
          id: "feature-xpressflame",
          title: "XpressFlame 2.0 Burner",
          shortLabel: "Fast Heating",
          benefit: "Heats food faster while improving energy efficiency.",
          technicalProof: "22.2% faster heating and 23.8% energy saving.",
          priority: 1,
          sourceAssetId: "asset-mega-oven-front"
        },
        {
          id: "feature-large-cavity",
          title: "Larger Cooking Area",
          shortLabel: "20T Platform Upgrade",
          benefit: "Provides more usable depth for family cooking.",
          technicalProof: "Effective depth increases from 460mm to 595mm.",
          priority: 2,
          sourceAssetId: "asset-mega-oven-front"
        },
        {
          id: "feature-bluesmile",
          title: "BlueSmile Design",
          shortLabel: "Safe And Easy Clean",
          benefit: "Improves safety and makes everyday cleaning easier.",
          technicalProof: "Flameout protection, one-hand ignition, removable glass door.",
          priority: 3,
          sourceAssetId: "asset-mega-oven-front"
        }
      ]
    }
  }
];

export function getPrimaryDemoProduct() {
  return demoProducts[0];
}

