function tabsToHTML(tabs, now) {
  var allTabs = [];
  for (let tab of tabs) {
    if (tab.incognito === true) {
      // skip private tabs
      continue;
    }
    var tabInfo = {
      'title' : tab.title,
      'url' : tab.url,
    };
    allTabs.push(tabInfo);
  }
  var doc = document.implementation.createHTMLDocument(
    allTabs.length + ' browser tabs');

  var newMeta = document.createElement('meta');
  newMeta.setAttribute('charset', 'utf-8');

  var newStyle = document.createElement('style');
  newStyle.setAttribute('type', 'text/css');
  newStyle.innerHTML = `
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    h1 { text-align: center; }
    .tab-container { 
      display: flex; 
      flex-wrap: wrap; 
      justify-content: space-between; 
    }
    .tab-item { 
      width: 30%; 
      margin-bottom: 20px; 
      box-shadow: 0 0 10px rgba(0,0,0,0.1); 
      padding: 15px; 
    }
    .tab-item h2 { 
      margin-top: 0; 
      font-size: 18px; 
    }
    .tab-item a { 
      text-decoration: none; 
      color: #0066cc; 
    }
    .tab-item p { 
      font-size: 14px; 
      color: #666; 
    }
    .info-footer { 
      margin-top: 40px; 
      border-top: 1px solid #ccc; 
      padding-top: 20px; 
    }
    @media (max-width: 768px) { 
      .tab-item { width: 100%; } 
    }
  `;

  doc.head.appendChild(newMeta);
  doc.head.appendChild(newStyle);

  var headerElement = document.createElement('h1');
  headerElement.textContent = allTabs.length + ' Saved Tabs';
  doc.body.appendChild(headerElement);

  var tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container';

  for (let tab of allTabs) {
    var tabItem = document.createElement('div');
    tabItem.className = 'tab-item';

    var titleElement = document.createElement('h2');
    var titleLink = document.createElement('a');
    titleLink.href = tab.url;
    titleLink.textContent = tab.title;
    titleElement.appendChild(titleLink);

    var urlElement = document.createElement('p');
    urlElement.textContent = tab.url;

    tabItem.appendChild(titleElement);
    tabItem.appendChild(urlElement);

    tabContainer.appendChild(tabItem);
  }

  doc.body.appendChild(tabContainer);

  var infoFooter = document.createElement('div');
  infoFooter.className = 'info-footer';

  var infoList = document.createElement('ul');

  var infoItems = [
    allTabs.length + ' tabs',
    'User agent: ' + navigator.userAgent,
    'Date: ' + now.toString(),
    'ISO date: ' + now.toISOString(),
    'Locale date: ' + now.toLocaleString(),
    'JSON date: ' + now.toJSON(),
    'YYYY-MM-DD (local): ' + getDateYYYYMMDD(now),
    'Milliseconds since Unix epoch: ' + now.getTime()
  ];

  infoItems.forEach(item => {
    var li = document.createElement('li');
    li.textContent = item;
    infoList.appendChild(li);
  });

  infoFooter.appendChild(infoList);
  doc.body.appendChild(infoFooter);

  return doc;
}
