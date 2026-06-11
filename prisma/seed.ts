import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clear existing data
  await prisma.favorite.deleteMany({});
  await prisma.customOrder.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.goldPrice.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});

  // 2. Create Admin User
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'مجوهرات حمزة (المدير)',
      phone: '0910000000',
      email: 'admin@hamzajewelry.com',
      password: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user created:', admin.email);

  // 3. Create Branches
  const branchData = [
    {
      name: 'فرع شارع الجمهورية',
      address: 'طرابلس، شارع الجمهورية بالقرب من مصرف ليبيا المركزي',
      phone: '0912223344',
      whatsapp: '+218912223344',
      workingHours: '9:00 ص - 9:00 م (السبت - الخميس)',
      mapUrl: 'https://maps.google.com/?q=Tripoli+Republic+Street',
    },
    {
      name: 'فرع جرابة',
      address: 'طرابلس، شارع جرابة بالقرب من طريق بن عاشور',
      phone: '0913334455',
      whatsapp: '+218913334455',
      workingHours: '10:00 ص - 10:00 م (السبت - الخميس)',
      mapUrl: 'https://maps.google.com/?q=Tripoli+Jaraba+Street',
    },
    {
      name: 'فرع حي الأندلس',
      address: 'طرابلس، حي الأندلس المقابل لمركز المدينة التجاري',
      phone: '0914445566',
      whatsapp: '+218914445566',
      workingHours: '10:00 ص - 10:00 م (السبت - الخميس)',
      mapUrl: 'https://maps.google.com/?q=Tripoli+Hay+Al+Andalus',
    },
    {
      name: 'فرع النوفليين',
      address: 'طرابلس، منطقة النوفليين بالقرب من ميدان زاوية الدهماني',
      phone: '0915556677',
      whatsapp: '+218915556677',
      workingHours: '9:00 ص - 9:00 م (السبت - الخميس)',
      mapUrl: 'https://maps.google.com/?q=Tripoli+Nofleen',
    },
    {
      name: 'فرع المدينة القديمة - جملة',
      address: 'طرابلس، سوق الذهب بالمدينة القديمة',
      phone: '0916667788',
      whatsapp: '+218916667788',
      workingHours: '9:00 ص - 5:00 م (السبت - الخميس)',
      mapUrl: 'https://maps.google.com/?q=Tripoli+Old+City+Gold+Market',
    },
  ];

  const branches = [];
  for (const b of branchData) {
    const branch = await prisma.branch.create({ data: b });
    branches.push(branch);
  }
  console.log(`Seeded ${branches.length} branches.`);

  // 4. Create Initial Gold Prices
  const goldPrice = await prisma.goldPrice.create({
    data: {
      karat18: 260.0,
      karat21: 305.0,
      karat24: 350.0,
      updatedBy: admin.id,
    },
  });
  console.log('Initial gold prices seeded:', goldPrice);

  // 5. Create Categories
  const categoryData = [
    { nameAr: 'ذهب', nameEn: 'Gold', image: 'uploads/cat_gold.png', sortOrder: 1 },
    { nameAr: 'ألماس', nameEn: 'Diamond', image: 'uploads/cat_diamond.png', sortOrder: 2 },
    { nameAr: 'ساعات', nameEn: 'Watches', image: 'uploads/cat_watches.png', sortOrder: 3 },
    { nameAr: 'خواتم', nameEn: 'Rings', image: 'uploads/cat_rings.png', sortOrder: 4 },
    { nameAr: 'عقود', nameEn: 'Necklaces', image: 'uploads/cat_necklaces.png', sortOrder: 5 },
    { nameAr: 'أساور', nameEn: 'Bracelets', image: 'uploads/cat_bracelets.png', sortOrder: 6 },
    { nameAr: 'أقراط', nameEn: 'Earrings', image: 'uploads/cat_earrings.png', sortOrder: 7 },
    { nameAr: 'أطقم أعراس', nameEn: 'Wedding Sets', image: 'uploads/cat_wedding_sets.png', sortOrder: 8 },
    { nameAr: 'إكسسوار رجالي', nameEn: 'Men Accessories', image: 'uploads/cat_men_accessories.png', sortOrder: 9 },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryData) {
    const cat = await prisma.category.create({ data: c });
    categories[c.nameAr] = cat.id;
  }
  console.log('Seeded categories.');

  // 6. Create Seed Products
  const productsData = [
    {
      categoryId: categories['ذهب'],
      nameAr: 'طقم ذهب بحريني فاخر عيار 21',
      nameEn: 'Bahraini Luxury Gold Set 21K',
      descriptionAr: 'طقم ذهب بحريني صياغة كويتية فاخرة عيار 21، يتميز بنقوش تراثية وتفاصيل دقيقة غاية في الجمال والروعة.',
      descriptionEn: 'Premium Bahraini gold set, 21 karat, crafted with Kuwaiti traditional designs and fine details.',
      karat: 21,
      weight: 48.5,
      makingCost: 45.0,
      estimatedPrice: 48.5 * 305 + 48.5 * 45, // weight * current21 + weight * making
      stoneType: 'بدون فصوص',
      availabilityStatus: 'AVAILABLE',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: false,
      images: [
        'uploads/prod_gold_set.png'
      ]
    },
    {
      categoryId: categories['ألماس'],
      nameAr: 'خاتم سوليتير ألماس بلجيكي فاخر',
      nameEn: 'Belgian Diamond Solitaire Ring',
      descriptionAr: 'خاتم سوليتير مرصع بقطعة ألماس بلجيكي نقية بوزن 0.70 قيراط، مصاغ من الذهب الأبيض عيار 18 الأكثر فخامة.',
      descriptionEn: 'Solitaire ring set with a 0.70 carat pure Belgian diamond, crafted in premium 18 karat white gold.',
      karat: 18,
      weight: 4.2,
      makingCost: 650.0, // flat custom design cost
      estimatedPrice: 4.2 * 260 + 650 + 4500, // weight * current18 + making + diamond value
      stoneType: 'ألماس بلجيكي VVS1',
      availabilityStatus: 'AVAILABLE',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      images: [
        'uploads/prod_diamond_ring.png'
      ]
    },
    {
      categoryId: categories['ساعات'],
      nameAr: 'ساعة رولكس ديت جست إطار ذهبي مضلع',
      nameEn: 'Rolex Datejust Fluted Bezel',
      descriptionAr: 'ساعة رولكس ديت جست مقاس 36 مم أويستر ستيل وذهب أصفر، ميناء زيتوني فاخر مع علامات ألماس.',
      descriptionEn: 'Rolex Datejust 36mm in Oystersteel and yellow gold, featuring a luxurious olive dial set with diamonds.',
      karat: 18,
      weight: 12.0, // gold content estimation
      makingCost: 1500.0,
      estimatedPrice: 78500.0, // flat price watch
      stoneType: 'ألماس رولكس أصلي',
      availabilityStatus: 'AVAILABLE',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      isOffer: false,
      images: [
        'uploads/prod_rolex_watch.png'
      ]
    },
    {
      categoryId: categories['أطقم أعراس'],
      nameAr: 'طقم ملكي مرصع بالكامل بالزفير والألماس',
      nameEn: 'Royal Sapphire and Diamond Wedding Set',
      descriptionAr: 'طقم زفاف ملكي متكامل يحتوي على عقد، إسوارة، خاتم، وأقراط. مرصع بأحجار الزفير الأزرق الملكي والألماس النقي.',
      descriptionEn: 'Complete royal wedding set including necklace, bracelet, ring, and earrings. Adorned with royal blue sapphires and brilliant cut diamonds.',
      karat: 18,
      weight: 85.0,
      makingCost: 3500.0,
      estimatedPrice: 95000.0, // set price
      stoneType: 'زفير طبيعي + ألماس',
      availabilityStatus: 'BY_ORDER',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      images: [
        'uploads/prod_sapphire_set.png'
      ]
    },
    {
      categoryId: categories['إكسسوار رجالي'],
      nameAr: 'كبك رجالي عيار 18 مرصع بحجر الأونيكس الأسود',
      nameEn: 'Men 18K Gold Cufflinks with Black Onyx',
      descriptionAr: 'كبك رجالي فاخر صياغة إيطالية عيار 18 من الذهب الأصفر، يتوسطه حجر أونيكس أسود مصقول بعناية.',
      descriptionEn: 'Premium Italian-made 18K yellow gold cufflinks for men, centered with a meticulously polished black onyx stone.',
      karat: 18,
      weight: 8.5,
      makingCost: 80.0,
      estimatedPrice: 8.5 * 260 + 8.5 * 80 + 350,
      stoneType: 'عقيق يماني أسود (أونيكس)',
      availabilityStatus: 'AVAILABLE',
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: false,
      images: [
        'uploads/prod_men_cufflinks.png'
      ]
    },
    {
      categoryId: categories['خواتم'],
      nameAr: 'توينز ذهب إيطالي عيار 18',
      nameEn: 'Italian Gold Twins Ring 18K',
      descriptionAr: 'توينز (خاتمين متطابقين) من الذهب الإيطالي الأبيض والأصفر عيار 18، يتميز بتصميم عصري ناعم ومرصع بفصوص الزركون السويسرية اللامعة.',
      descriptionEn: 'Italian gold twins ring set in 18K white and yellow gold, modern sleek design set with Swiss cubic zirconia.',
      karat: 18,
      weight: 6.8,
      makingCost: 65.0,
      estimatedPrice: 6.8 * 260 + 6.8 * 65 + 150,
      stoneType: 'زركون سويسري نخب أول',
      availabilityStatus: 'AVAILABLE',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: true,
      images: [
        'uploads/prod_twins_ring.png'
      ]
    }
  ];

  for (const p of productsData) {
    const { images, ...productFields } = p;
    const createdProduct = await prisma.product.create({
      data: productFields,
    });

    // Seed images
    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          imageUrl: images[i],
          sortOrder: i,
        },
      });
    }
  }

  // 7. Seed Settings
  const settingsData = [
    { key: 'site_name', value: 'مجوهرات حمزة — Jewelry Hamza' },
    { key: 'primary_phone', value: '+218910000000' },
    { key: 'whatsapp_number', value: '+218910000000' },
    { key: 'facebook_url', value: 'https://facebook.com/jewelry.hamza.tripoli' },
    { key: 'instagram_url', value: 'https://instagram.com/jewelry.hamza' },
    { key: 'address_main', value: 'طرابلس، شارع جرابة' },
    { key: 'about_us_ar', value: 'مجوهرات حمزة هي الاسم الرائد في عالم الصياغة الراقية بطرابلس، ليبيا. نقدم تشكيلات مميزة من الذهب والألماس والساعات الفاخرة.' },
    { key: 'about_us_en', value: 'Hamza Jewelry is the leading name in high-end gold craftsmanship in Tripoli, Libya, offering fine collections of gold, diamonds, and watches.' }
  ];

  for (const s of settingsData) {
    await prisma.setting.create({ data: s });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
