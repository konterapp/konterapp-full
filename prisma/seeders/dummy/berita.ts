/**
 * Dummy seeder untuk berita.
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/berita.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

const BERITA_DATA = [
  {
    title: "Event By Indonesia Resmi Diluncurkan untuk Mendukung Industri Event Nasional",
    slug: "event-by-indonesia-resmi-diluncurkan",
    content: "<p>Platform Event By Indonesia (EBI) resmi diluncurkan sebagai wadah terintegrasi untuk mendukung ekosistem industri event di Indonesia. Platform ini dirancang untuk mempermudah pengelolaan dan promosi event di seluruh wilayah Indonesia.</p><p>Dengan hadirnya EBI, diharapkan para pelaku industri event dapat lebih mudah dalam merencanakan, mengelola, dan mempromosikan event mereka kepada khalayak yang lebih luas.</p>",
    tags: ["event", "peluncuran", "nasional"],
    newsType: "spotlight",
    category: "mice",
    isPublished: true,
    publishedAt: new Date("2026-01-15"),
  },
  {
    title: "Festival Kuliner Nusantara 2026 Siap Digelar di Jakarta",
    slug: "festival-kuliner-nusantara-2026",
    content: "<p>Festival Kuliner Nusantara 2026 akan digelar di Jakarta Convention Center pada bulan Maret mendatang. Event tahunan ini menghadirkan lebih dari 500 booth kuliner dari 34 provinsi di Indonesia.</p><p>Panitia memperkirakan festival tahun ini akan menarik lebih dari 100.000 pengunjung selama 5 hari pelaksanaan. Berbagai program menarik seperti cooking class, food competition, dan talkshow bersama chef ternama turut disiapkan.</p>",
    tags: ["kuliner", "festival", "jakarta"],
    newsType: "artikel",
    category: "culinary",
    isPublished: true,
    publishedAt: new Date("2026-02-10"),
  },
  {
    title: "Konser Musik Internasional Bali Arts Festival Kembali Hadir",
    slug: "konser-musik-internasional-bali-arts-festival",
    content: "<p>Bali Arts Festival kembali hadir dengan mengusung tema \"Harmony of the Islands\". Festival seni dan musik internasional ini akan berlangsung selama satu bulan penuh di Taman Budaya Art Centre Denpasar.</p><p>Lebih dari 200 seniman dari 15 negara akan tampil memeriahkan festival yang sudah menjadi agenda tahunan pariwisata Bali ini.</p>",
    tags: ["musik", "bali", "internasional", "seni"],
    newsType: "rilis-pers",
    category: "music",
    isPublished: true,
    publishedAt: new Date("2026-02-20"),
  },
  {
    title: "Karnaval Budaya Nusantara Meriahkan Hari Kemerdekaan",
    slug: "karnaval-budaya-nusantara-kemerdekaan",
    content: "<p>Dalam rangka memperingati Hari Kemerdekaan Republik Indonesia, Karnaval Budaya Nusantara akan diselenggarakan di sepanjang Jalan Sudirman-Thamrin Jakarta. Event ini menampilkan parade kostum tradisional dari berbagai daerah.</p><p>Ribuan peserta dari perwakilan 34 provinsi akan memamerkan kekayaan budaya Indonesia melalui kostum, tarian, dan musik tradisional.</p>",
    tags: ["karnaval", "budaya", "kemerdekaan"],
    newsType: "spotlight",
    category: "carnaval",
    isPublished: true,
    publishedAt: new Date("2026-03-01"),
  },
  {
    title: "Kompetisi E-Sport Nasional Masuk Kalender Event Olahraga 2026",
    slug: "kompetisi-esport-nasional-kalender-2026",
    content: "<p>Kementerian Pemuda dan Olahraga resmi memasukkan kompetisi e-sport nasional ke dalam kalender event olahraga tahun 2026. Keputusan ini merupakan langkah strategis untuk mengakomodasi perkembangan industri e-sport di Indonesia.</p><p>Kompetisi ini akan melibatkan 5 game populer dengan total hadiah mencapai miliaran rupiah. Seleksi regional akan dimulai pada bulan April di 10 kota besar.</p>",
    tags: ["esport", "olahraga", "kompetisi"],
    newsType: "artikel",
    category: "sport-wellness",
    isPublished: true,
    publishedAt: new Date("2026-03-05"),
  },
  {
    title: "Pameran Seni Rupa Kontemporer Indonesia di Museum Nasional",
    slug: "pameran-seni-rupa-kontemporer-museum-nasional",
    content: "<p>Museum Nasional Jakarta akan menggelar pameran seni rupa kontemporer bertajuk \"Identitas dalam Kanvas\" selama 3 bulan. Pameran ini menampilkan karya dari 50 seniman muda Indonesia yang mengangkat tema identitas budaya di era digital.</p><p>Pameran ini terbuka untuk umum dan gratis, sebagai upaya mendekatkan seni kontemporer kepada masyarakat luas.</p>",
    tags: ["seni", "pameran", "kontemporer"],
    newsType: "rilis-pers",
    category: "art-culture",
    isPublished: true,
    publishedAt: new Date("2026-03-10"),
  },
  {
    title: "Workshop Industri Kreatif untuk UMKM di Yogyakarta",
    slug: "workshop-industri-kreatif-umkm-yogyakarta",
    content: "<p>Dinas Pariwisata dan Ekonomi Kreatif Yogyakarta menyelenggarakan workshop intensif bagi pelaku UMKM di bidang industri kreatif. Workshop berlangsung selama 3 hari dengan materi digital marketing, branding, dan product development.</p><p>Sebanyak 200 pelaku UMKM dari berbagai sektor kreatif seperti fashion, kerajinan, dan kuliner telah mendaftar untuk mengikuti program ini.</p>",
    tags: ["workshop", "umkm", "kreatif", "yogyakarta"],
    newsType: "artikel",
    category: "creative",
    isPublished: false,
    publishedAt: new Date("2026-03-15"),
  },
  {
    title: "Indonesia Convention Exhibition (ICE) BSD Jadi Venue MICE Terbesar di Asia Tenggara",
    slug: "ice-bsd-venue-mice-terbesar-asia-tenggara",
    content: "<p>Indonesia Convention Exhibition (ICE) BSD City resmi dinobatkan sebagai venue MICE terbesar di Asia Tenggara setelah menyelesaikan fase ekspansi terbarunya. Dengan total luas area pameran mencapai 220.000 meter persegi, ICE BSD siap menampung event berskala internasional.</p><p>Pencapaian ini diharapkan dapat meningkatkan daya saing Indonesia sebagai destinasi MICE kelas dunia.</p>",
    tags: ["mice", "venue", "bsd", "internasional"],
    newsType: "spotlight",
    category: "mice",
    isPublished: true,
    publishedAt: new Date("2026-03-12"),
  },
  {
    title: "Marathon Internasional Bali 2026 Dibuka Pendaftarannya",
    slug: "marathon-internasional-bali-2026-pendaftaran",
    content: "<p>Pendaftaran Marathon Internasional Bali 2026 resmi dibuka. Event lari tahunan ini menawarkan rute pemandangan alam Bali yang spektakuler dengan kategori Full Marathon, Half Marathon, dan 10K Fun Run.</p><p>Tahun lalu event ini berhasil menarik 15.000 peserta dari 40 negara. Panitia menargetkan peningkatan 20% peserta untuk edisi tahun ini.</p>",
    tags: ["marathon", "bali", "olahraga", "lari"],
    newsType: "rilis-pers",
    category: "sport-wellness",
    isPublished: false,
    publishedAt: new Date("2026-03-14"),
  },
  {
    title: "Konferensi Teknologi dan Inovasi Digital Indonesia 2026",
    slug: "konferensi-teknologi-inovasi-digital-2026",
    content: "<p>Konferensi Teknologi dan Inovasi Digital Indonesia (KTIDI) 2026 akan mempertemukan para inovator, startup founder, dan pemimpin industri teknologi dari seluruh Indonesia. Event ini mengusung tema \"Digital Transformation for Sustainable Growth\".</p><p>Lebih dari 50 pembicara nasional dan internasional akan berbagi insight tentang AI, blockchain, IoT, dan teknologi masa depan lainnya.</p>",
    tags: ["teknologi", "konferensi", "digital", "inovasi"],
    newsType: "artikel",
    category: "mice",
    isPublished: true,
    publishedAt: new Date("2026-03-08"),
  },
];

export async function seedBerita(prisma: PrismaClient) {
  // Get admin user as creator
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@eventbyid.com" },
  });

  if (!adminUser) {
    console.log("⚠ Admin user not found, skipping berita seed");
    return;
  }

  for (const data of BERITA_DATA) {
    await prisma.berita.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        uuid: uuidv7(),
        title: data.title,
        slug: data.slug,
        content: data.content,
        tags: data.tags,
        newsType: data.newsType,
        category: data.category,
        isPublished: data.isPublished,
        publishedAt: data.publishedAt,
        createdBy: adminUser.id,
      },
    });
  }

  console.log(`✓ ${BERITA_DATA.length} berita dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedBerita(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
