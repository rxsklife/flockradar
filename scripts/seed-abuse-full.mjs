#!/usr/bin/env node

import postgres from 'postgres';

const CASES = [
  {
    url: "https://www.clickorlando.com/news/investigators/2026/08/20/brevard-deputy-of-the-year-quits-after-egregious-misconduct-exposed/",
    title: "Brevard County, FL - August 2026",
    summary: "brevard county fl stalking flock former brevard deputy michael fultz resigned after an investigation uncovered \"egregious misconduct,\" including looking up his ex-girlfriend's license plate on flock.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.ajc.com/news/atlanta-news/three-former-bibb-deputies-charged-with-stalking-using-flock/",
    title: "Bibb County, GA - August 2026",
    summary: "bibb county ga stalking flock former deputy tony lewis was charged with stalking and other crimes after allegedly using the flock system to track someone he was in a relationship with.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.wpri.com/news/local-news/new-bedford-officer-on-leave-abuse-prevention-order/",
    title: "New Bedford, MA - August 2026",
    summary: "new bedford ma stalking flock new bedford officer emily pacheco was placed on leave and an investigation was opened after her ex-girlfriend filed for an abuse prevention order against her. pacheco allegedly stalked her ex using flock cameras.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.ajc.com/news/atlanta-news/three-former-bibb-deputies-charged-with-stalking-using-flock/",
    title: "Bibb County, GA - August 2026",
    summary: "bibb county ga stalking flock former deputy coznavian stubbs was charged with stalking and other crimes after allegedly using the flock system to track someone he was in a relationship with.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.ajc.com/news/atlanta-news/three-former-bibb-deputies-charged-with-stalking-using-flock/",
    title: "Bibb County, GA - August 2026",
    summary: "bibb county ga stalking flock former deputy joseph callaway was charged with stalking and other crimes after allegedly using the flock system to track someone he was in a relationship with.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://abcnews.com/US/officer-allegedly-flock-license-plate-cameras-track-boyfriends/story?id=135418955",
    title: "Mooresville, NC - August 2026",
    summary: "mooresville nc stalking flock officer elizabeth snowman was criminally charged after allegedly using flock cameras to track the location of her boyfriend's ex-wife.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.nola.com/news/crime_police/article_eee92a8e-5af3-11ef-96eb-9b8d02bafb.html",
    title: "Jefferson Parish, LA - August 2026",
    summary: "jefferson parish la stalking flock after an inquiry from a reporter, the jefferson parish sheriff's office fired deputy nathan rome after determining he had searched for his ex-fiancee's license plate thousands of times over several years. the ex-fiancee told investigators she was aware of the unauthorized searches.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.azcentral.com/story/news/local/arizona/2026/08/14/apache-junction-officer-resigns-flock-misuse/",
    title: "Apache Junction, AZ - August 2026",
    summary: "apache junction az stalking flock former officer joshua mcdaniels resigned at the conclusion of an investigation that found he improperly used flock to look up the location of his wife.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.firstalert4.com/2026/07/09/police-brentwood-officers-used-license-plate-reader-cameras-track-ex-wife/",
    title: "Brentwood, MO - August 2026",
    summary: "brentwood mo stalking flock an outside investigation found that an unnamed officer committed \"sustained policy violations\" by using the flock system to track the location of his ex-wife during their divorce proceedings.",
    publishedAt: "2026-08-15",
  },
  {
    url: "https://www.nowhabersham.com/habersham-county-deputy-fired-arrested-after-flock-camera-misuse/",
    title: "Habersham County, GA - July 2026",
    summary: "habersham county ga stalking flock deputy christian brewer was fired and arrested after an internal audit uncovered he used the flock system to track the whereabouts of a person he was in a relationship with.",
    publishedAt: "2026-07-15",
  },
  {
    url: "https://www.fox35orlando.com/news/sumter-county-deputy-charged-misuse-police-databases",
    title: "Sumter County, FL - July 2026",
    summary: "sumter county fl stalking flock sumter county detective brandy almany was fired and criminally charged after allegedly using flock and other police databases to track her husband's ex-wife.",
    publishedAt: "2026-07-15",
  },
  {
    url: "https://ij.org/police-have-reportedly-used-license-plate-readers-to-stalk-romantic-interests-at-least-14-times-in-recent-years/",
    title: "Statesboro, GEORGIA - June 2026",
    summary: "statesboro ga stalking flock andrae wright, a former effingham county sheriff's office employee and investigator with the ogeechee circuit district attorney's office, was charged with stalking and other crimes for alleged misuse of the flock system.",
    publishedAt: "2026-06-15",
  },
  {
    url: "https://www.khou.com/article/news/investigations/pasadena-police-officer-resigns-flock-camera-investigation/285-6f9b9b1c/",
    title: "Pasadena, TX - May 2026",
    summary: "pasadena tx stalking flock pasadena sargeant michael palitz resigned while under investigation for allegedly misusing the department's flock camera system. officials told news outlet kprc 2 that palitz was using the cameras to \"track and stalk a female officer.\"",
    publishedAt: "2026-05-15",
  },
  {
    url: "https://www.ajc.com/news/atlanta-news/alpharetta-officer-investigated-for-allegedly-using-flock-cameras-to-track-ex/",
    title: "Alpharetta, GA - April 2026",
    summary: "alpharetta ga stalking flock an internal investigation concluded that patrolman dustin bozzo used the flock system dozens of times to track the whereabouts of a former romantic partner employed by the police department, as well as another officer who he mistakenly perceived to be a romantic rival. bozzo resigned and the case is now under criminal investigation.",
    publishedAt: "2026-04-15",
  },
  {
    url: "https://www.ajc.com/news/atlanta-news/former-gwinnett-officer-charged-with-stalking-using-police-databases/",
    title: "Gwinnett County, GA - April 2026",
    summary: "gwinnett county ga stalking unspecified officer renee downer was arrested and relieved of duty after allegedly using law enforcement databases, including a license plate reader system, to monitor the location of an ex-romantic partner.",
    publishedAt: "2026-04-15",
  },
  {
    url: "https://www.rockdalenewtoncitizen.com/news/crime/conyers-police-employee-fired-charged-flock",
    title: "Conyers, GA - April 2026",
    summary: "conyers ga stalking flock paige forte, a supervisor in the conyers police department's real-time crime center, was fired and charged after allegedly using the flock system to monitor her domestic partner's location.",
    publishedAt: "2026-04-15",
  },
  {
    url: "https://www.wbaltv.com/article/officer-fired-flock-cameras-south-carolina/73453532",
    title: "Mauldin, SC - March 2026",
    summary: "mauldin sc stalking flock officer ellie hammond was fired after using flock cameras to track a former romantic partner 166 times.",
    publishedAt: "2026-03-15",
  },
  {
    url: "https://www.flkeysnews.com/news/local/article288450055.html",
    title: "Monroe County, FL - February 2026",
    summary: "key west fl stalking guardian sheriff's deputy lamar roman allegedly used an alpr system to track and eventually pull over a woman he had met while providing security on a tv set. roman was arrested and charged with accessing a computer or electronic device without authorization.",
    publishedAt: "2026-02-15",
  },
  {
    url: "https://www.nbc4i.com/news/local-news/reynoldsburg-officer-resigns-flock-investigation/",
    title: "Reynoldsburg, OH - January 2026",
    summary: "reynoldsburg oh stalking flock reynoldsburg officer mark nichols resigned after an investigation found he searched for the license plates of a former domestic partner.",
    publishedAt: "2026-01-15",
  },
  {
    url: "https://fitsnews.com/2026/06/09/greer-police-officer-fired-after-flock-misuse/",
    title: "Greer, SC - December 2025",
    summary: "greer sc stalking flock former police corporal kareem lynch was fired after an internal audit revealed he had allegedly used the department's flock system to monitor the whereabouts of a subordinate with whom he had a previous relationship.",
    publishedAt: "2025-12-15",
  },
  {
    url: "https://www.kansascity.com/news/local/crime/article315320483.html",
    title: "Bonner Springs, KS - November 2025",
    summary: "bonner springs ks stalking flock detective kyle rector allegedly used license plate readers to track his estranged wife and two men he suspected were her new romantic partners. he was charged with multiple crimes in march 2026.",
    publishedAt: "2025-11-15",
  },
  {
    url: "https://www.nwfdailynews.com/story/news/crime/2025/10/17/niceville-officer-coty-hall-flock/",
    title: "Niceville, FL - October 2025",
    summary: "niceville fl stalking flock former niceville officer coty hall pleaded no contest to several charges after using the department's flock system to track another officer and that officer's spouse. hall's misconduct was discovered via an internal audit; hall was fired following his arrest in october 2025.",
    publishedAt: "2025-10-15",
  },
  {
    url: "https://www.khou.com/video/news/local/sources-katy-pd-officer-fired-charged-for-allegedly-using-flock-cameras-more-than-2300-times/",
    title: "Katy, TX - October 2025",
    summary: "katy tx stalking flock officer sergio rodriguez was fired and indicted for allegedly using the flock system to track his ex-partner more than 2,000 times over a period of 11 months.",
    publishedAt: "2025-10-15",
  },
  {
    url: "https://wisconsinexaminer.com/2026/08/18/ex-menasha-officer-sentenced-6-months-in-jail-for-misusing-flock-cameras/",
    title: "Menasha, WI - October 2025",
    summary: "menasha wi stalking flock officer cristian morales was placed on leave and charged with misconduct in office after his ex-girlfriend filed a complaint alleging that he used a flock system to track her.",
    publishedAt: "2025-10-15",
  },
  {
    url: "https://www.wifr.com/2025/09/15/holiday-hills-police-chief-arrested-search-warrant-other-offenses/",
    title: "Prairie Grove, IL - September 2025",
    summary: "prairie grove il stalking flock officer william c. copp, who also served as the police chief of nearby holiday hills, was arrested after searching flock for several former romantic partners and at least one of their new partners. copp has been fired from his prairie grove position and his employment with holiday hills is under review.",
    publishedAt: "2025-09-15",
  },
  {
    url: "https://ij.org/police-have-reportedly-used-license-plate-readers-to-stalk-romantic-interests-at-least-14-times-in-recent-years/",
    title: "Kenosha County, WI - September 2025",
    summary: "kenosha county wi stalking flock sheriff's deputy frank mcgrath resigned with severance pay after internal investigators found he used the department's flock system to keep tabs on another deputy with whom he was romantically involved. he was charged with two felonies in august 2026.",
    publishedAt: "2025-09-15",
  },
  {
    url: "https://www.rrstar.com/story/news/crime/2025/07/22/former-winery-county-sheriff-deputy-charged/",
    title: "Winnebago County, IL - July 2025",
    summary: "winnebago county il stalking unspecified former sheriff's deputy tyler bryan was charged with stalking and official misconduct after allegedly using the department's alpr system to monitor the locations of an ex-girlfriend and her new partner. the misconduct came to light after the victims filed for an order of protection against bryan.",
    publishedAt: "2025-07-15",
  },
  {
    url: "https://www.ktvb.com/article/news/local/jerome-county-sheriff-flock-cameras-search-wife/277-8f5b5c7a/",
    title: "Jerome County, ID - July 2025",
    summary: "jerome county id stalking flock sheriff george oppedyk used a flock system to search for his wife's vehicle hundreds of times. idaho's attorney general concluded that no crime was committed, but oppedyk retired in april 2026, two years before his term of office ended.",
    publishedAt: "2025-07-15",
  },
  {
    url: "https://www.wrdw.com/2025/06/24/former-deputy-arrested-after-allegedly-tracking-woman-with-flock-cameras/",
    title: "Richmond County, GA - June 2025",
    summary: "richmond county ga stalking flock former deputy jaquarius yarbrough was arrested after allegedly using the flock system to track the license plate of a woman he'd been having an affair with 1,639 times over several months.",
    publishedAt: "2025-06-15",
  },
  {
    url: "https://fitsnews.com/2026/06/09/greer-police-officer-fired-after-flock-misuse/",
    title: "Greer, SC - May 2025",
    summary: "greer sc stalking flock former greer officer sebastian echeverry was fired after allegedly using the department's flock system for personal use. according to fitsnews reporting, \"at least one of echeverry's unauthorized searches allegedly targeted his ex-girlfriend.\"",
    publishedAt: "2025-05-15",
  },
  {
    url: "https://www.fox6now.com/news/milwaukee-police-officer-charged-with-misusing-flock-database",
    title: "Milwaukee, WI - March 2025",
    summary: "milwaukee wi stalking flock officer josue ayala allegedly used the department's network of flock alprs to track a woman he was dating and her ex-partner nearly 180 times over a two-month period. ayala resigned in 2026 after being charged with misconduct in public office.",
    publishedAt: "2025-03-15",
  },
  {
    url: "https://www.wdrb.com/news/crime-reports/former-louisville-police-officer-accused-of-stalking-ex-girlfriend-remains-jailed/",
    title: "Louisville, KY - March 2025",
    summary: "louisville ky stalking flock officer roberto cedeno was charged with multiple felonies after allegedly using the city's alpr system to track an ex-partner and her friends hundreds of times over two months.",
    publishedAt: "2025-03-15",
  },
  {
    url: "https://stopflock.org/",
    title: "Matteson, IL - December 2024",
    summary: "matteson il stalking flock according to internal documents obtained by stopflock.org, officer jaila cole-clark ran hundreds of flock searches for her former domestic partner and that individual's new partner. cole-clark resigned from department in the middle of the investigation.",
    publishedAt: "2024-12-15",
  },
  {
    url: "https://lifesitenews.com/news/police-officer-arrested-after-using-flock-cameras-717-times-to-track-ex-wife",
    title: "Haines City, FL - September 2024",
    summary: "haines city fl stalking flock haines city officer christopher goodson was put on leave and arrested after an investigation revealed he searched the flock database for his estranged wife's car more than 700 times between september 1, 2024 and june 30, 2026.",
    publishedAt: "2024-09-15",
  },
  {
    url: "https://www.actionnews5.com/2024/08/27/shelby-county-deputy-removed-from-duty-after-allegedly-tracking-ex-wife/",
    title: "Shelby County, TN - August 2024",
    summary: "shelby county tn stalking unspecified deputy thadius gordon was relieved of duty after allegedly using an alpr database to track his ex-wife's location more than 100 times.",
    publishedAt: "2024-08-15",
  },
  {
    url: "https://tech-oracle.com/a-georgia-police-chief-allegedly-tracked-his-ex-girlfriends-license-plate-600-times-using-flock-cameras/",
    title: "Braselton, GA - July 2024",
    summary: "braselton ga stalking flock police chief michael steffman was arrested after allegedly using license plate readers to stalk and harass multiple people, including a former romantic partner. steffman resigned shortly before his arrest.",
    publishedAt: "2024-07-15",
  },
  {
    url: "https://www.desertsun.com/story/news/crime/2024/06/14/riverside-deputy-alexander-vanny-flock/",
    title: "Riverside County, CA - June 2024",
    summary: "riverside county ca stalking flock after being arrested for kidnapping his ex-fiance, deputy alexander vanny allegedly used the department's flock system to track one of her friends. in december 2025 he was convicted of multiple charges in a jury trial.",
    publishedAt: "2024-06-15",
  },
  {
    url: "https://www.boston.com/news/local-news/2026/08/03/stow-police-officer-flock-camera-misuse/",
    title: "Stow, MA - June 2024",
    summary: "stow ma stalking flock the stow police department placed officer jason rogers on unpaid leave and filed a criminal complaint against him after rogers allegedly used flock and other databases to stalk a former romantic partner who said she had changed her identity to escape from his abuse. the victim discovered rogers had been stalking her by using the haveibeenflocked website.",
    publishedAt: "2024-06-15",
  },
  {
    url: "https://www.clickorlando.com/news/local/2024/06/11/orange-city-officer-arrested-accused-of-stalking-girlfriend/",
    title: "Orange City, FL - June 2024",
    summary: "orange city fl stalking flock officer jarmarus brown allegedly used alprs to stalk his girlfriend and her family members more than 100 times over seven months. brown was arrested and charged in 2025.",
    publishedAt: "2024-06-15",
  },
  {
    url: "https://www.wtxl.com/news/local-news/coffee-county-deputy-arrested-charged-with-misusing-flock",
    title: "Coffee County, GA - April 2024",
    summary: "coffee county ga stalking flock former coffee county sheriff's deputy chris rozar was charged with multiple criminal offenses after allegedly using the department's flock system to stalk a woman he was romantically interested in. rozar was fired from the department at the beginning of the investigation.",
    publishedAt: "2024-04-15",
  },
  {
    url: "https://www.kansas.com/news/local/article260905245.html",
    title: "Sedgwick, KS - October 2023",
    summary: "sedgwick ks stalking flock police chief lee nygaard resigned after using flock cameras to track his ex-girlfriend and her new boyfriend more than 200 times over several months.",
    publishedAt: "2023-10-15",
  },
  {
    url: "https://stopflocksafety.org/articles/costa-mesa-officer-flock-mistress-guilty-plea/",
    title: "Costa Mesa, CA - June 2023",
    summary: "costa mesa ca stalking flock officer robert josett used a flock camera system to track his mistress and her other romantic interests. josett pleaded guilty to multiple criminal charges in april 2026.",
    publishedAt: "2023-06-15",
  },
  {
    url: "https://www.kansas.com/news/local/crime/article255987675.html",
    title: "Kechi, KS - October 2022",
    summary: "kechi ks stalking flock kechi lieutenant victor heiar pleaded guilty to computer crime and stalking after using flock cameras to track his estranged wife.",
    publishedAt: "2022-10-15",
  },
  {
    url: "https://www.click2houston.com/news/investigators/2022/01/13/fort-bend-county-officer-used-license-plate-readers-to-track-multiple-people/",
    title: "Fort Bend County, TX - January 2022",
    summary: "fort bend county tx stalking flock a fort bend county sheriff's office lieutenant used flock cameras to monitor the locations of multiple people dozens of times starting january 2022. one of those people was in a \"contentious familial relationship\" with the lieutenant. the lieutenant was suspended for two days.",
    publishedAt: "2022-01-15",
  },
  {
    url: "https://triblive.com/local/westmoreland/2021/09/24/former-officer-pleads-guilty-to-stalking/",
    title: "Westmoreland County, PA - September 2021",
    summary: "westmoreland county pa stalking unspecified officer michael mcsherry pleaded guilty to stalking charges after using readers to track his estranged wife and other family members.",
    publishedAt: "2021-09-15",
  },
];

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
let inserted = 0;
let skipped = 0;
for (const c of CASES) {
  const res = await sql`
    INSERT INTO abuse_cases (url, title, summary, published_at, status)
    VALUES (${c.url}, ${c.title}, ${c.summary}, ${c.publishedAt}::timestamptz, 'approved')
    ON CONFLICT (url) DO NOTHING
    RETURNING id`;
  if (res.length) inserted++;
  else skipped++;
}
console.log('Inserted', inserted, 'new cases;', skipped, 'already present.');
await sql.end();
