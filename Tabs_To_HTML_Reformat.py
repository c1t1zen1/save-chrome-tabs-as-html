import re
from bs4 import BeautifulSoup

def reformat_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Move browser data to the bottom
    browser_data = soup.find('ul')
    body = soup.find('body')
    body.append(browser_data)
    
    # Create three-column format for tab links
    links = soup.find_all('dt')
    num_links = len(links)
    col_size = (num_links + 2) // 3  # Round up division
    
    new_content = soup.new_tag('div', style='display: flex; justify-content: space-between;')
    
    for i in range(3):
        col = soup.new_tag('div', style='width: 32%; display: flex; flex-direction: column;')
        for j in range(i * col_size, min((i + 1) * col_size, num_links)):
            dt = links[j]
            dd = dt.find_next_sibling('dd')
            link = dt.find('a')
            link['target'] = '_blank'  # Make links open in a new tab
            col.append(dt)
            col.append(dd)
        new_content.append(col)
    
    dl = soup.find('dl')
    dl.replace_with(new_content)
    
    # Add styling, including word wrap and break
    style = soup.find('style')
    style.string += """
    body { font-family: Arial, sans-serif; color: #727272; max-width: 1000px; margin: auto; padding: 10px; background-color: black; }
    dt { font-size: 1.3em; font-weight: bold; }
    dd { display: none; }
    .browser-data {
        margin-top: 20px;
        border-top: 1px solid #ccc;
        padding-top: 10px;
        cursor: pointer;
    }
    .browser-data ul {
        margin: 0;
        padding: 0;
        list-style-type: none;
    }
    .browser-data li:not(:first-child) {
        display: none;
    }
    .browser-data.expanded li:not(:first-child) {
        display: block;
        margin-top: 5px;
    }
    .browser-data::after {
        content: ' ▼';
        font-size: 0.8em;
        vertical-align: middle;
    }
    .browser-data.expanded::after {
        content: ' ▲';
    }
    a { color: #727272; text-decoration: none; }
    a:hover { color: white; }
    .column {
        width: 32%;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
    }
    dt, dd {
        margin-bottom: 10px;
    }
    """
    
    # Wrap browser data in a div with class and add click functionality
    browser_data['class'] = 'browser-data'
    script = soup.new_tag('script')
    script.string = """
    document.querySelector('.browser-data').addEventListener('click', function() {
        this.classList.toggle('expanded');
    });
    """
    body.append(script)
    
    # Apply the 'column' class to each column
    for col in new_content.find_all('div', recursive=False):
        col['class'] = col.get('class', []) + ['column']
    
    return str(soup)

# Read the HTML file
with open('toFormat.html', 'r', encoding='utf-8') as file:
    html_content = file.read()

# Reformat the HTML
reformatted_html = reformat_html(html_content)

# Write the reformatted HTML to a new file
with open('reformatted.html', 'w', encoding='utf-8') as file:
    file.write(reformatted_html)

print("HTML has been reformatted and saved as 'reformatted.html'")