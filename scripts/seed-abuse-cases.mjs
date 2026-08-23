#!/usr/bin/env node

import postgres from 'postgres';

const CASES = [
  {
    url: 'https://lifesitenews.com/news/police-officer-arrested-after-using-flock-cameras-717-times-to-track-ex-wife',
    title: 'Haines City officer tracked his estranged wife 717 times',
    summary:
      'Christopher Goodson, an officer in Haines City, Florida, looked up his estranged wife\u2019s license plate in the Flock database 717 times between September 2024 and June 2026, on and off duty. He was charged with offenses against users of computers and electronic devices and official misconduct.',
    sourceName: 'LifeSiteNews',
    publishedAt: '2026-08-21',
  },
  {
    url: 'https://wisconsinexaminer.com/2026/08/18/menasha-office-sentenced-for-abusing-flock-as-statewide-reckoning-continues/',
    title: 'Menasha officer sentenced for seven off-duty Flock searches',
    summary:
      'Cristian Morales, a 32-year-old Menasha, Wisconsin officer, was sentenced to six months in jail and three years of probation after pleading no contest. His seven off-duty searches reached up to 92,702 cameras across Flock\u2019s nationwide network while he tracked his ex-girlfriend\u2019s vehicle.',
    sourceName: 'Wisconsin Examiner',
    publishedAt: '2026-08-18',
  },
  {
    url: 'https://www.fox6now.com/news/milwaukee-police-flock-camera-misuse-officer-guilty',
    title: 'Former Milwaukee officer pleads guilty to Flock tracking',
    summary:
      'Josue Ayala, a former Milwaukee police officer, pleaded guilty in June 2026 to misusing the department\u2019s Flock license plate reader system to track someone he had dated. Milwaukee police said a second officer was also under investigation.',
    sourceName: 'FOX6 Milwaukee',
    publishedAt: '2026-06-11',
  },
  {
    url: 'https://www.ktre.com/2026/08/20/1-officer-arrested-1-placed-leave-amid-lufkin-flock-camera-misuse-investigation',
    title: 'Lufkin officer arrested; grand jury later returned 100 felony counts',
    summary:
      'Zachary Anthony Klein, an 11-year Lufkin, Texas police veteran, was arrested by the Texas Rangers on charges of abuse of official capacity and tampering with a government record over Flock misuse. A grand jury later indicted him on 100 felony counts; a second officer was placed on leave.',
    sourceName: 'KTRE',
    publishedAt: '2026-08-20',
  },
  {
    url: 'https://wjcl.com/article/savannah-police-employees-arrested-flock-misuse/73498458',
    title: 'Savannah police: four former employees arrested for Flock misuse',
    summary:
      'The Georgia Bureau of Investigation arrested four former Savannah Police employees: officers Marquis Dillard, Donald Phillips, and Matthew Rich, plus civilian employee Calandic Thomas. Each was charged with misuse of the license plate reader system, and the three officers also face violating their oath of office. Six employees were fired in total.',
    sourceName: 'WJCL',
    publishedAt: '2026-08-21',
  },
  {
    url: 'https://www.nola.com/news/crime_police/jpso-deputy-flock-camera-abuse/article_eee92a8e-17c2-4543-8ce3-92691f02bafb.html',
    title: 'Jefferson Parish deputy fired after thousands of Flock searches',
    summary:
      'A Jefferson Parish, Louisiana deputy was fired after admitting to abusing Flock cameras, searching for his ex-fiancee\u2019s vehicle thousands of times. Sheriff Joseph Lopinto said the deputy\u2019s access was revoked and the case was referred to prosecutors.',
    sourceName: 'NOLA.com',
    publishedAt: '2026-08-19',
  },
  {
    url: 'https://www.azfamily.com/2026/08/13/chandler-police-officer-resigns-admits-misusing-flock-cameras/',
    title: 'Chandler officer resigns after admitting Flock misuse',
    summary:
      'A Chandler, Arizona officer resigned after admitting he used the Flock system improperly, including looking up a family member who had a health emergency. Four metro Phoenix police agencies announced investigations into license plate reader misuse the same week.',
    sourceName: 'Arizona\u2019s Family',
    publishedAt: '2026-08-13',
  },
  {
    url: 'https://www.click2houston.com/news/local/2026/08/19/deer-park-police-officer-suspended-after-using-license-plate-cameras-for-personal-use/',
    title: 'Deer Park officer suspended after 165 personal plate runs',
    summary:
      'A Deer Park, Texas officer was suspended for 10 days after an internal audit found he ran license plates 165 times for personal use. The department added new safeguards and a transparency portal for Flock camera access.',
    sourceName: 'KPRC Click2Houston',
    publishedAt: '2026-08-19',
  },
  {
    url: 'https://www.boston.com/news/local-news/2026/08/18/stow-police-cut-ties-with-flock-safety-after-officer-alleged',
    title: 'Stow cuts ties with Flock after officer misused databases',
    summary:
      'Stow, Massachusetts placed Officer Jason Rogers on unpaid leave facing termination and criminal charges after he allegedly ran vehicle information through Flock and searched criminal records for a person he knew multiple times during 2024 and 2025. The town disabled its Flock cameras and ended its contract.',
    sourceName: 'Boston.com',
    publishedAt: '2026-08-18',
  },
  {
    url: 'https://www.wishtv.com/news/chief-recommends-firing-impd-officer-who-misused-license-plate-readers',
    title: 'Indianapolis chief recommends firing officer over plate reader misuse',
    summary:
      'Indianapolis Metropolitan Police Chief Tanya Terry recommended firing an officer who misused license plate readers, as a criminal investigation continued. The case emerged amid a nationwide wave of ALPR abuse disclosures.',
    sourceName: 'WISH-TV',
    publishedAt: '2026-08-13',
  },
  {
    url: 'https://www.wsbtv.com/news/georgia/5-ex-georgia-police-officers-charged-misuse-license-plate-reader-data/4HLOM',
    title: 'Albany: five former officers charged over plate reader misuse',
    summary:
      'The Georgia Bureau of Investigation arrested five former Albany Police Department officers on charges of misusing the license plate reader system. The arrests were part of a statewide GBI push that has led to at least 20 officials arrested for Flock database misuse.',
    sourceName: 'WSB-TV',
    publishedAt: '2026-07-06',
  },
  {
    url: 'https://www.ajc.com/news/2026/08/tool-for-tracking-flock-camera-access-leads-to-more-police-abuse-allegations',
    title: 'Polk County task-force officer faces four charges',
    summary:
      'A former Polk County, Georgia officer who worked on the GBI\u2019s Northwest Georgia Drug Task Force was charged with four counts after an audit tool tracked his access to the Flock camera network, connecting him to misuse allegations.',
    sourceName: 'Atlanta Journal-Constitution',
    publishedAt: '2026-08-07',
  },
  {
    url: 'https://www.washingtonpost.com/technology/2026/08/19/we-found-cops-who-misused-flock-their-police-departments-',
    title: 'Washington Post: departments missed misuse until an audit tool found it',
    summary:
      'The Washington Post used Flock\u2019s Audit Assistance tool to identify officers who misused the camera network without their departments knowing. Savannah police said the tool helped them discover misuse by four officers, prompting firings and arrests.',
    sourceName: 'The Washington Post',
    publishedAt: '2026-08-19',
  },
  {
    url: 'https://ij.org/press-release/new-nationwide-campaign-seeks-to-stop-warrantless-use-of-license-plate-reader-cam',
    title: 'Institute for Justice documents 14 stalking cases in recent years',
    summary:
      'Institute for Justice research found at least 14 cases in recent years where police officers used license plate readers to stalk romantic interests, part of a nationwide campaign to stop warrantless ALPR use.',
    sourceName: 'Institute for Justice',
    publishedAt: '2026-07-01',
  },
  {
    url: 'https://sls.eff.org/technologies/automated-license-plate-readers-alprs',
    title: 'The early landmark: an officer\u2019s blackmail scheme using plate data',
    summary:
      'One of the earliest documented abuses of ALPR data: an officer looked up license plates of vehicles seen near a gay bar and used that information to blackmail the drivers, a case documented by the Wall Street Journal and catalogued by the EFF.',
    sourceName: 'Electronic Frontier Foundation',
    publishedAt: '2013-01-15',
  },
];

const sql = postgres(process.env.DATABASE_URL, { max: 2 });

try {
  let inserted = 0;
  for (const c of CASES) {
    const [row] = await sql`
      insert into abuse_cases (url, title, summary, source_name, published_at, status, reviewed_at)
      values (${c.url}, ${c.title}, ${c.summary}, ${c.sourceName}, ${new Date(c.publishedAt)}, 'approved', now())
      on conflict (url) do nothing
      returning id
    `;
    if (row) inserted += 1;
  }
  const [total] = await sql`select count(*)::int as n from abuse_cases where status = 'approved'`;
  console.log(`Inserted ${inserted} new cases; ${total.n} approved total.`);
} finally {
  await sql.end();
}
