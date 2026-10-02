module.exports = {
  content: ['./index.html', './*/index.html'],
  theme: {extend: {
    colors: {deepspace:'#05070a',cardbg:'#0f141e',
      copper:{400:'#e49b73',500:'#c86b3c',600:'#a35025',700:'#8b401a'},
      cyan:{400:'#22d3ee',500:'#06b6d4'}},
    fontFamily:{sans:['Inter','system-ui','sans-serif'],mono:['JetBrains Mono','monospace'],brand:['Saira','Inter','sans-serif']},
    backgroundImage:{'grid-pattern':`url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zM20 0h20v20H20V0z' fill='%231e293b' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`}
  }}
};
