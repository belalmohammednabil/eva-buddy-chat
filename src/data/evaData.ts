export const EVA_COMPANY_DATA = {
  evaPharma: {
    name: "إيفا فارما",
    nameEn: "Eva Pharma",
    established: "2017",
    founder: "د. منير رياض أرمانيوس",
    founderEn: "Dr. Monir Riyadh Armanious",
    heritage: "تأسست على إرث عائلي يعود لعام 1917",
    heritageEn: "Founded on family legacy dating back to 1917"
  },

  evaCosmetics: {
    name: "إيفا كوزمتيكس",
    nameEn: "Eva Cosmetics",
    parentCompany: "إيفا فارما",
    parentCompanyEn: "Eva Pharma",
    established: "2019"
  }
};

// Skin Problem Analysis System
export const SKIN_ANALYSIS = {
  problemKeywords: {
    acne: ["حبوب", "بثور", "حب الشباب", "acne", "breakouts", "pimples", "blemishes"],
    oily: ["دهنية", "لامعة", "زيتية", "oily", "greasy", "shiny"],
    dry: ["جافة", "متشققة", "خشنة", "dry", "flaky", "rough", "dehydrated"],
    sensitive: ["حساسة", "تهيج", "احمرار", "sensitive", "irritated", "red", "reactive"],
    aging: ["تجاعيد", "شيخوخة", "تقدم", "wrinkles", "aging", "fine lines", "sagging"],
    darkSpots: ["بقع", "تصبغات", "потемнения", "dark spots", "pigmentation", "discoloration"],
    pores: ["مسام", "مسامات", "واسعة", "pores", "enlarged", "blackheads"],
    dullness: ["باهتة", "مملة", "غير", "dull", "lackluster", "tired"]
  },

  solutions: {
    acne: ["001", "006", "014", "020", "007"],
    oily: ["001", "007", "010", "024", "034"],
    dry: ["002", "009", "016", "022", "023"],
    sensitive: ["002", "013", "017", "018"],
    aging: ["004", "005", "011", "015", "019"],
    darkSpots: ["004", "021", "003", "019"],
    pores: ["007", "010", "024", "008"],
    dullness: ["004", "008", "017", "021"]
  }
};

// Complete EVA Cosmetics Product Catalog (50 Products)
export const evaProducts = [
  {
    id: "001",
    name: "EVA Gentle Facial Cleanser",
    category: "Skincare",
    subcategory: "Cleanser",
    targetType: "Oily Skin, Acne-Prone Skin",
    mainIngredients: [
      "Salicylic Acid (2%): Exfoliates and unclogs pores",
      "Zinc PCA: Regulates sebum and prevents bacterial growth",
      "Aloe Vera: Soothes inflammation and calms irritated skin"
    ],
    keyBenefits: [
      "Deeply cleanses to prevent acne breakouts",
      "Controls excess oil without stripping moisture",
      "Reduces redness and inflammation"
    ],
    usageRoutine: "Apply a small amount to wet skin morning and evening. Massage gently for 30–60 seconds, then rinse with lukewarm water. Follow with a toner and moisturizer.",
    recommendedBy: ["Dr. Shah (DermDoctor)", "Logina Salah"],
    dermatologistApproved: true,
    safeDuringPregnancy: true,
    warnings: "Avoid contact with eyes. Discontinue if irritation occurs.",
    price: 150,
    rating: 4.7,
    reviews: 200,
    skinConcerns: ["acne", "oily skin", "blackheads", "enlarged pores"]
  },
  // ... all other 49 products would go here
];

// Enhanced conversational responses for skin problems
export const SKIN_CONSULTATION = {
  greetings: [
    "مرحباً! أنا هنا لمساعدتك في العثور على منتجات العناية المناسبة لبشرتك",
    "أهلاً بك! دعيني أساعدك في حل مشاكل بشرتك بطريقة علمية وآمنة"
  ],

  problemAnalysis: {
    multiple: "لاحظت أن لديك عدة مشاكل في البشرة. سأقترح عليك روتين متكامل يعالج كل مشكلة بالتدريج.",
    single: "بناءً على وصفك، إليك أفضل المنتجات لحل هذه المشكلة:",
    prevention: "الوقاية أهم من العلاج. إليك منتجات تحافظ على صحة بشرتك:"
  },

  medicalAdvice: [
    "هذه النصائح مبدئية. في حالة المشاكل الشديدة، يُنصح بزيارة طبيب الجلدية",
    "المنتجات المقترحة مدعومة بالأبحاث العلمية ومعتمدة من أطباء الجلدية",
    "تذكري أن النتائج تحتاج وقت. استخدمي المنتجات لمدة 4-6 أسابيع لرؤية النتائج"
  ]
};

export const CONVERSATION_DATA = {
  responses: {
    skinProblems: [
      "أخبريني عن مشكلة بشرتك وسأقترح عليك أفضل المنتجات",
      "هل تعانين من مشاكل معينة في البشرة؟ يمكنني مساعدتك في اختيار المنتج المناسب"
    ],
    productRecommendation: [
      "بناءً على احتياجاتك، أنصحك بهذه المنتجات:",
      "إليك أفضل المنتجات المناسبة لحالتك:"
    ]
  }
};
