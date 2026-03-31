import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    // --- Seed Admin User ---
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@iworth.tech' },
        update: {},
        create: {
            email: 'admin@iworth.tech',
            name: 'iWorth Admin',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            isVisible: true,
        },
    });
    console.log('✅ Seeded admin:', admin.email);

    // --- Real iWorth Technologies Opportunities ---
    const events = [
        // ===== EXPOS & CONFERENCES =====
        {
            title: 'GITEX Kenya x AI Everything Kenya 2026',
            description: `Africa's largest technology exhibition comes to Nairobi. iWorth can exhibit interactive displays, AV installations, networking hardware and STEM robotics kits to thousands of government, enterprise and education buyers. Estimated 20,000+ attendees from 40+ countries. Buyer types: government ministries, universities, corporate IT buyers. How to participate: Book a stand, demo iWorth interactive panels and robotics kits, engage procurement officers from Ministry of Education and ICT.`,
            date: new Date('2026-05-19T08:00:00.000Z'),
            location: 'Kenyatta International Convention Centre (KICC), Nairobi',
            priorityScore: 10,
            tags: ['exhibition', 'AV', 'interactive-displays', 'government', 'enterprise', 'STEM', 'networking'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'aieverythingkenya.com',
        },
        {
            title: 'Africa Technology Show Kenya 2026 (AFTS Kenya)',
            description: `5th edition of East Africa's premier B2B technology exhibition. Themes: Smart Cities, Consumer Technology, Industry 4.0. iWorth can showcase AV systems, smart displays and networking infrastructure to enterprise and government buyers. Co-located with CTW Kenya 2026 and WITIA Summit. Buyer types: smart city planners, enterprise IT, government agencies. How to participate: Exhibit, sponsor a smart-cities demo zone, pitch to procurement delegations.`,
            date: new Date('2026-07-08T08:00:00.000Z'),
            location: 'Kenyatta International Convention Centre (KICC), Nairobi',
            priorityScore: 9,
            tags: ['exhibition', 'smart-cities', 'networking', 'AV', 'enterprise', 'government'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'africatechshow.com',
        },
        {
            title: 'Solar Africa 2026 (11th Edition) – Power & Energy Africa',
            description: `East Africa's premier solar and renewable energy exhibition. iWorth's solar PV installation and electrical services offerings are a perfect fit. Buyers include government bodies (KPLC, REREC), hospitality, schools and developers. How to participate: Exhibit solar + electrical installation portfolio, meet REREC and county government procurement officers, partner with panel manufacturers for supply deals. Co-located with Power & Energy Africa 2026.`,
            date: new Date('2026-07-29T08:00:00.000Z'),
            location: 'Kenyatta International Convention Centre (KICC), Nairobi',
            priorityScore: 9,
            tags: ['solar', 'energy', 'electrical', 'exhibition', 'government', 'REREC'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'expogr.com',
        },
        {
            title: 'Solar & Storage Live Kenya 2026',
            description: `Focused exhibition on solar PV, energy storage, and smart grid technology. iWorth's electrical and solar installation services directly align with exhibitor profiles. Key buyers: developers, county governments, NGOs, schools going off-grid. How to participate: Exhibit, tender for on-site installation contracts, meet storage manufacturers for reseller partnerships.`,
            date: new Date('2026-08-26T08:00:00.000Z'),
            location: 'Kenyatta Convention Centre, Nairobi',
            priorityScore: 8,
            tags: ['solar', 'energy-storage', 'electrical', 'exhibition', 'NGO', 'government'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'africanpowerplatform.org',
        },
        {
            title: '2026 Young Scientists Kenya – National Science & Technology Exhibition',
            description: `National STEM showcase themed "Shaping Kenya's AI Future Using STEM" (Aug 4–8). Over 500 schools competing. iWorth can sponsor the robotics zone, supply robotics kits and STEM classroom hardware, and meet school principals, county education directors and Ministry of Education buyers. Ideal opportunity to position iWorth as the go-to STEM technology supplier for Kenyan schools. How to participate: Sponsor, exhibit robotics kits, demo interactive STEM displays.`,
            date: new Date('2026-08-04T08:00:00.000Z'),
            location: 'Kenyatta International Convention Centre, Nairobi',
            priorityScore: 9,
            tags: ['STEM', 'robotics', 'education', 'schools', 'government', 'exhibition'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'ysk.co.ke',
        },
        {
            title: 'Powerelec Kenya 2026 – Solar & Energy Exhibition',
            description: `Leading solar and power exhibition covering renewable energy, energy storage, and electrical industries. Draws 40+ countries. iWorth's solar installation and electrical teams can exhibit, demo projects and pitch to county governments, private developers and international NGOs. Networking with suppliers creates reseller/distributor opportunities.`,
            date: new Date('2026-06-15T08:00:00.000Z'),
            location: 'Sarit Expo Centre, Nairobi',
            priorityScore: 8,
            tags: ['solar', 'electrical', 'energy', 'exhibition', 'NGO', 'government'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'powereleckenya.com',
        },

        // ===== GOVERNMENT TENDERS =====
        {
            title: 'TENDER: Supply & Installation of AV Equipment – Government Open Tender',
            description: `Open government tender for "Supply of Audio-Visual Equipment Including Screens, Projectors and Related Equipment". Deadline: March 6, 2026. Buyer type: Government agency. iWorth directly supplies and installs AV equipment including interactive screens and projectors. How to participate: Download from tenders.go.ke, prepare technical and financial bid. iWorth qualifications: registered AV contractor, relevant past projects. Source: tendersontime.com`,
            date: new Date('2026-03-06T00:00:00.000Z'),
            location: 'Nairobi, Kenya (Government Tender)',
            priorityScore: 10,
            tags: ['tender', 'AV', 'government', 'procurement', 'screens', 'projectors'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'tendersontime.com / tenders.go.ke',
        },
        {
            title: 'TENDER: KenGen – Supply & Installation of AV and Interactive Screen (Executive Boardroom)',
            description: `Kenya Electricity Generating Company PLC (KenGen) tender for "Supply and Installation of Audio Visual and Interactive Screen in the Executive Boardroom." Buyer: Parastatal (KenGen). Perfect fit for iWorth's AV installation and interactive display services. How to participate: Obtain tender document from tenders.go.ke, submit technical specs for interactive screen + AV system, include installation plan and warranty. Priority: Very High.`,
            date: new Date('2026-03-20T00:00:00.000Z'),
            location: 'KenGen HQ, Nairobi, Kenya',
            priorityScore: 10,
            tags: ['tender', 'AV', 'interactive-displays', 'parastatal', 'KenGen', 'installation'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'tenders.go.ke',
        },
        {
            title: 'TENDER: National Land Commission – ICT Networking, Firewall & Maintenance Services',
            description: `The National Land Commission is procuring "ICT Related Software, Networking, Firewall, SLAs and ICT Maintenance Services." Deadline: March 10, 2026. Buyer: Government Commission. iWorth's networking infrastructure services directly match. How to participate: Obtain from tenders.go.ke, submit networking capability portfolio, certifications (e.g. Cisco, Fortinet), and proposed SLA terms.`,
            date: new Date('2026-03-10T00:00:00.000Z'),
            location: 'National Land Commission, Nairobi',
            priorityScore: 9,
            tags: ['tender', 'networking', 'ICT', 'firewall', 'government', 'maintenance'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'biddetail.com / tenders.go.ke',
        },
        {
            title: 'TENDER: Communications Authority Kenya – Internet Connectivity & WAN for 5 Offices',
            description: `Communications Authority of Kenya (CA) open national tender for "Provision of Internet Connectivity and Related ICT Components at CA Centre and Four Regional Offices" plus "Point to Point (WAN) Connectivity." Deadline: March 2026. Buyer: Government Regulator. iWorth's networking division can bid for the WAN connectivity and infrastructure component. How to participate: ca.go.ke tender portal; highlight fiber/radio link expertise.`,
            date: new Date('2026-03-25T00:00:00.000Z'),
            location: 'Communications Authority of Kenya, Nairobi',
            priorityScore: 9,
            tags: ['tender', 'networking', 'WAN', 'internet', 'government', 'ICT'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'ca.go.ke',
        },
        {
            title: 'TENDER: Kisii University – Computers, Laptops, Printers, AV & ICT Accessories',
            description: `Kisii University procurement for "Desktop Computers, Server, Laptops, Printers, Scanners, Photocopiers, Audio Equipment and ICT Accessories." Deadline: March 3, 2026. Buyer: University / Public Institution. iWorth supplies all listed hardware categories. How to participate: Download docs from university procurement portal, submit competitive pricing for full ICT bundle, include support/warranty terms. Great entry into university sector.`,
            date: new Date('2026-03-03T00:00:00.000Z'),
            location: 'Kisii University, Kisii County',
            priorityScore: 8,
            tags: ['tender', 'education', 'computers', 'AV', 'ICT', 'university'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'biddetail.com',
        },
        {
            title: 'TENDER: REREC – Solar Floodlights, High Mast & Streetlights for Energy Centres',
            description: `Rural Electrification and Renewable Energy Corporation (REREC) tender for "Supply, Installation, Testing, Commissioning and Servicing of Solar Floodlights/High Mast with Motion Sensors and Integrated Solar Streetlights." Deadline: February 23, 2026. Buyer: Government Agency. iWorth's solar and electrical teams can deliver. How to participate: tendersure.africa or REREC portal; submit solar installation track record, technical specs, and compliance certificates.`,
            date: new Date('2026-02-23T00:00:00.000Z'),
            location: 'REREC, Nairobi (Nationwide Installation)',
            priorityScore: 8,
            tags: ['tender', 'solar', 'electrical', 'government', 'REREC', 'installation'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'tendersure.africa',
        },
        {
            title: 'TENDER: Moi Teaching & Referral Hospital – ICT Equipment & Accessories',
            description: `Moi Teaching and Referral Hospital procurement of "ICT Equipment and Accessories." Deadline: March 3, 2026. Buyer: Public Health Institution. iWorth can supply desktop computers, networking gear, displays and accessories. Hospitals also require AV systems for conference rooms and theatres. How to participate: Submit via hospital procurement portal; include hardware specs, warranty and AMC (Annual Maintenance Contract) proposal.`,
            date: new Date('2026-03-03T00:00:00.000Z'),
            location: 'Moi Teaching & Referral Hospital, Eldoret',
            priorityScore: 7,
            tags: ['tender', 'ICT', 'computers', 'networking', 'hospital', 'government'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'biddetail.com',
        },

        // ===== EDUCATION / STEM PROGRAMS =====
        {
            title: 'CEMASTEA Robotics Teacher Training Program – Coding & Robotics Kits',
            description: `The Centre for Mathematics, Science and Technology Education in Africa (CEMASTEA) is conducting a nationwide teacher-training program on coding and robotics (Jan 22–24, 2026) at Karen, Nairobi, for Junior School teachers. 1,600 new STEM labs are being built nationwide. iWorth can partner with CEMASTEA to supply robotics kits, coding hardware and interactive STEM displays to these labs. How to participate: Contact CEMASTEA partnerships team, present iWorth's STEM catalogue, propose a supply framework contract.`,
            date: new Date('2026-03-15T08:00:00.000Z'),
            location: 'CEMASTEA HQ, Karen, Nairobi (+ Nationwide Schools)',
            priorityScore: 10,
            tags: ['STEM', 'robotics', 'education', 'government', 'schools', 'partnership'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'educationnews.co.ke / cemastea.or.ke',
        },
        {
            title: 'Kenya Science and Engineering Fair (KSEF) 2026 – Sponsorship & Supply',
            description: `KSEF 2026 is expanding to include Junior School learners (Grades 7–9) alongside senior students. Regional workshops underway in Nairobi. iWorth can sponsor the event, supply robotics kits to competing schools, and set up demo booths for interactive STEM displays. Direct access to school principals, teachers and county education buyers. How to participate: Contact KSEF organizing committee for sponsorship tiers; supply competition robotics kits; host an iWorth STEM lab showcase.`,
            date: new Date('2026-05-10T08:00:00.000Z'),
            location: 'University of Nairobi + Regional Centers, Nairobi',
            priorityScore: 9,
            tags: ['STEM', 'robotics', 'education', 'schools', 'sponsorship', 'government'],
            conflictStatus: false,
            state: 'PUBLISHED',
            rawSource: 'youtube.com / ksef.go.ke',
        },
    ];

    // Clear old events and reseed fresh
    await prisma.event.deleteMany({});
    await prisma.event.createMany({
        data: events.map(e => ({
            ...e,
            state: e.state as any,
            createdById: admin.id,
        })),
    });

    console.log(`✅ Seeded ${events.length} real iWorth Technologies opportunities.`);
    console.log(`   - 6 Expos & Conferences`);
    console.log(`   - 7 Government Tenders`);
    console.log(`   - 2 Education/STEM Partnerships`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
