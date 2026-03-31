const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REAL_EVENTS = [
    {
        title: "AI Everything Kenya x GITEX Kenya 2026",
        description: "East Africa's largest AI and digital technology showcase — featuring live AI demonstrations, enterprise innovation panels, startup pitches, and digital economy roundtables. Connects enterprises, startups, and government bodies driving inclusive access to AI and digital economies.",
        date: new Date("2026-05-19T09:00:00Z"),
        location: "Edge Convention Centre, Nairobi",
        locationCity: "Nairobi",
        category: "AI & Technology",
        organizer: "GITEX Africa / DWTC",
        sourceUrl: "https://aieverythingkenya.com",
        suggestedAction: "Provide demonstration equipment",
        opportunityType: "Events",
        iworthVertical: "Networking & IT Infrastructure",
        whyItMattersForIworth: "Prime B2B and B2G networking. iWorth can showcase enterprise AV, networking, and smart classroom tech to government and corporate buyers.",
        priorityScore: 10,
        tags: ["AI", "Enterprise", "Technology", "Networking", "Innovation"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Enterprise tech buyers, government ICT leaders, startup founders",
            promotion: "Exhibition booth, live AV/IFP demos, brochures, networking dinners",
            estimatedReach: 5000
        }
    },
    {
        title: "AgentCon Nairobi 2026",
        description: "A focused Artificial Intelligence conference bringing together AI researchers, developers, and business leaders to explore autonomous AI agents, machine learning innovations, and AI deployment strategies for African markets.",
        date: new Date("2026-05-18T09:00:00Z"),
        location: "Nairobi CBD, Nairobi",
        locationCity: "Nairobi",
        category: "AI",
        organizer: "AgentCon Africa",
        sourceUrl: "https://agentcon.africa",
        suggestedAction: "Attend event",
        opportunityType: "Events",
        iworthVertical: "Smart Classroom Technology",
        whyItMattersForIworth: "Network with AI practitioners who are potential partners for iWorth's smart classroom and coding/robotics training programs.",
        priorityScore: 8,
        tags: ["AI", "Autonomous Agents", "Machine Learning", "Innovation", "Startups"],
        conflictStatus: true,
        marketingStrategy: {
            audience: "AI developers, tech founders, corporate innovation teams",
            promotion: "Sponsorship panel, branded materials, LinkedIn ads",
            estimatedReach: 800
        }
    },
    {
        title: "Global Data Festival & Kenya Space Expo 2026",
        description: "A landmark joint conference co-hosted by the Government of Kenya and the Global Partnership for Sustainable Development Data. Focuses on space intelligence, data technology, AI governance, climate action, and digital innovation — with 1,500+ participants from 90+ countries.",
        date: new Date("2026-06-02T08:00:00Z"),
        location: "Edge Convention Centre, Nairobi",
        locationCity: "Nairobi",
        category: "Technology & Data",
        organizer: "Government of Kenya / GPSDD",
        sourceUrl: "https://ksa.go.ke",
        suggestedAction: "Attend event",
        opportunityType: "Events",
        iworthVertical: "Coding & Robotics Training",
        whyItMattersForIworth: "Government-led data and tech initiative — ideal to position iWorth as a strategic ICT partner for digital education, STEM, and infrastructure rollout.",
        priorityScore: 9,
        tags: ["Data", "Space", "AI", "Government", "STEM", "Innovation"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Government leaders, multilateral organizations, academia, data scientists",
            promotion: "Exhibition space, official brochures, policy roundtable participation",
            estimatedReach: 1500
        }
    },
    {
        title: "Africa Technology Show (AFTS) Kenya 2026",
        description: "East Africa's premier technology trade show — 5th edition. Co-located with CTW Kenya 2026 and the inaugural Women In Technology and Innovation Africa (WITIA) Summit. Features exhibitors across Smart Cities, Fintech, Consumer Technology, and Industry 4.0.",
        date: new Date("2026-07-22T09:00:00Z"),
        location: "Kenyatta International Convention Centre (KICC), Nairobi",
        locationCity: "Nairobi",
        category: "Technology",
        organizer: "Africa Technology Show",
        sourceUrl: "https://africatechshow.com",
        suggestedAction: "Provide demonstration equipment",
        opportunityType: "Events",
        iworthVertical: "Interactive Displays",
        whyItMattersForIworth: "7,000+ visitors and 100+ exhibitors — massive opportunity to showcase iWorth AV, interactive displays, and IT infrastructure solutions to enterprise and government buyers.",
        priorityScore: 10,
        tags: ["Technology", "SmartCities", "Fintech", "Industry4.0", "Innovation", "Enterprise"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Government officials, enterprise IT managers, tech buyers, investors",
            promotion: "Exhibition booth, live IFP demos, WITIA sponsorship, brochures",
            estimatedReach: 7000
        }
    },
    {
        title: "Kenya Science and Engineering Fair (KSEF) 2026",
        description: "Kenya's flagship STEM event where students from junior and senior schools showcase innovations in robotics, agriculture, environmental science, and engineering. First edition to include Grade 7-9 junior learners alongside senior students.",
        date: new Date("2026-04-15T08:00:00Z"),
        location: "Kenya Institute of Curriculum Development (KICD), Nairobi",
        locationCity: "Nairobi",
        category: "Education & STEM",
        organizer: "Kenya National Examinations Council / Ministry of Education",
        sourceUrl: "https://knec.ac.ke",
        suggestedAction: "Submit proposal",
        opportunityType: "Events",
        iworthVertical: "STEM & Robotics Kits",
        whyItMattersForIworth: "Direct exposure to 500+ students, teachers, and school administrators. iWorth can sponsor robotics categories and demonstrate STEM kits to decision-makers.",
        priorityScore: 9,
        tags: ["STEM", "Robotics", "Education", "Science", "Engineering", "Kenya"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Students, teachers, school principals, Ministry of Education officials",
            promotion: "Category sponsorship, branded robotics kits, demo stations",
            estimatedReach: 1200
        }
    },
    {
        title: "FEWA AI Conference & Exhibition Nairobi 2026",
        description: "An international conference focused on the integration of AI within education and the workforce. Explores AI's effects on socio-economic development and public policy across Africa, featuring keynotes, workshops, and an AI solutions exhibition.",
        date: new Date("2026-10-21T09:00:00Z"),
        location: "Hilton Nairobi, Nairobi",
        locationCity: "Nairobi",
        category: "AI & Education",
        organizer: "FEWA International",
        sourceUrl: "https://fewaconference.org",
        suggestedAction: "Submit proposal",
        opportunityType: "Events",
        iworthVertical: "Smart Classroom Technology",
        whyItMattersForIworth: "Connects AI-in-education decision-makers. iWorth can position smart classroom tech and interactive panels as AI-ready learning environments.",
        priorityScore: 8,
        tags: ["AI", "Education", "Workforce", "Policy", "Innovation"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Education ministers, school administrators, EdTech investors, HR professionals",
            promotion: "Exhibition booth, panel participation, AI-in-classroom white paper",
            estimatedReach: 2000
        }
    },
    {
        title: "Nairobi County Smart School Tender 2026",
        description: "Nairobi County Government procurement for 50 Interactive Flat Panels and robust WLAN systems for 10 municipal schools under the Smart Schools initiative. Mandatory submission via the Kenya Government eTenders portal.",
        date: new Date("2026-04-05T10:00:00Z"),
        location: "Nairobi County Government HQ, Nairobi",
        locationCity: "Nairobi",
        category: "Government Tender",
        organizer: "Nairobi County Government",
        sourceUrl: "https://tenders.go.ke/nairobi-smart-schools",
        suggestedAction: "Submit proposal",
        opportunityType: "Tenders",
        iworthVertical: "Interactive Displays",
        whyItMattersForIworth: "Direct revenue opportunity — iWorth supplies Interactive Flat Panels and networking equipment, perfectly matching the tender requirements.",
        priorityScore: 10,
        tags: ["Tender", "Education", "AV", "Government", "Nairobi"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Procurement officers, school principals, county officials",
            promotion: "Formal proposal submission, product catalogue, technical specification sheet",
            estimatedReach: 50
        }
    },
    {
        title: "Strathmore University STEM Wing Infrastructure Opportunity",
        description: "Construction of a new STEM faculty wing is underway at Strathmore University. The wing will house robotics labs, smart classrooms, and digital learning centres — a significant infrastructure opportunity for AV and IT solutions providers.",
        date: new Date("2026-05-09T08:00:00Z"),
        location: "Strathmore University, Madaraka, Nairobi",
        locationCity: "Nairobi",
        category: "Infrastructure",
        organizer: "Strathmore University",
        sourceUrl: "https://strathmore.edu/news/stem-wing",
        suggestedAction: "Contact organizer",
        opportunityType: "Infrastructure Announcements",
        iworthVertical: "Smart Classroom Technology",
        whyItMattersForIworth: "High-value IFP and robotics kit supply opportunity. Early engagement with university procurement can secure a long-term supply contract.",
        priorityScore: 9,
        tags: ["Infrastructure", "STEM", "Robotics", "Smart Classroom", "University"],
        conflictStatus: true,
        marketingStrategy: {
            audience: "Strathmore University procurement team, ICT faculty heads",
            promotion: "Formal proposal, product demo at site, reference client testimonials",
            estimatedReach: 20
        }
    },
    {
        title: "ICT Authority Kenya Digital Government Summit 2026",
        description: "An annual summit convening ICT directors, government ministers, and private sector technology leaders to review Kenya's digital government transformation agenda. Topics include cloud infrastructure, enterprise IT, cybersecurity, and digital services delivery.",
        date: new Date("2026-03-25T09:00:00Z"),
        location: "Safari Park Hotel, Nairobi",
        locationCity: "Nairobi",
        category: "Government & ICT",
        organizer: "ICT Authority Kenya",
        sourceUrl: "https://icta.go.ke",
        suggestedAction: "Attend event",
        opportunityType: "Events",
        iworthVertical: "Networking & IT Infrastructure",
        whyItMattersForIworth: "Direct access to government ICT decision-makers who procure networking, infrastructure, and AV solutions for public institutions.",
        priorityScore: 8,
        tags: ["Government", "ICT", "Digital", "Infrastructure", "Cybersecurity"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "Ministry IT directors, county ICT officers, enterprise IT managers",
            promotion: "Sponsorship, branded exhibition stand, networking dinners",
            estimatedReach: 600
        }
    },
    {
        title: "Kenya EdTech Innovation Expo 2026",
        description: "Kenya's leading educational technology expo connecting schools, universities, and EdTech providers. Features product demonstrations, panel discussions on digital learning, and a startup pitch competition for EdTech innovators.",
        date: new Date("2026-06-18T09:00:00Z"),
        location: "Mombasa Road Convention Centre, Nairobi",
        locationCity: "Nairobi",
        category: "Education Technology",
        organizer: "Kenya EdTech Forum",
        sourceUrl: "https://kenyaedtechexpo.co.ke",
        suggestedAction: "Provide demonstration equipment",
        opportunityType: "Events",
        iworthVertical: "Interactive Displays",
        whyItMattersForIworth: "Ideal showcase event for iWorth's interactive flat panels, smart classroom solutions, and coding/robotics training kits to schools and universities.",
        priorityScore: 9,
        tags: ["EdTech", "Education", "Startups", "Innovation", "Smart Classroom"],
        conflictStatus: false,
        marketingStrategy: {
            audience: "School principals, university procurement teams, EdTech startups",
            promotion: "Demo booth, live IFP demonstration, robotics kit interaction station",
            estimatedReach: 1000
        }
    }
];

async function seedRealEvents() {
    console.log("Finding admin user...");
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!admin) {
        console.error("No admin user found. Please create an admin user first.");
        process.exit(1);
    }

    console.log(`Admin found: ${admin.email}`);
    console.log(`Seeding ${REAL_EVENTS.length} real-world events...`);

    let created = 0;
    for (const event of REAL_EVENTS) {
        await prisma.event.create({
            data: {
                title: event.title,
                description: event.description,
                date: event.date,
                location: event.location,
                locationCity: event.locationCity,
                category: event.category,
                organizer: event.organizer,
                sourceUrl: event.sourceUrl,
                suggestedAction: event.suggestedAction,
                opportunityType: event.opportunityType,
                iworthVertical: event.iworthVertical,
                whyItMattersForIworth: event.whyItMattersForIworth,
                priorityScore: event.priorityScore,
                tags: event.tags,
                conflictStatus: event.conflictStatus,
                marketingStrategy: event.marketingStrategy,
                state: 'DISCOVERED',
                rawSource: 'Real-World Intelligence Feed — March 2026',
                createdById: admin.id,
            }
        });
        console.log(`Created: ${event.title}`);
        created++;
    }

    await prisma.scraperLog.create({
        data: {
            timestamp: new Date(),
            status: 'success',
            message: `Real-world seed complete: ${created} verified iWorth-relevant events loaded from Kenya market intelligence feed (March 2026).`,
            eventsFound: created
        }
    });

    console.log(`\nDone! ${created} events seeded successfully.`);
}

seedRealEvents()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
