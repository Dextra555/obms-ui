<<<<<<< HEAD
const PROXY_CONFIG = [
  {
    context: [
      "/weatherforecast",
    ],
    target: "https://localhost:7155",
    secure: false
  },
  {
    context: [
      "/reports",
      "/Finance",
      "/Payroll",
      "/Accounting",
      "/Inventory",
      "/Master",
      "/EmployeeResignedList.aspx",
      "/Default.aspx",
      "/CrystalReport1.rpt"
    ],
    target: "http://localhost:8080",
    secure: false,
    pathRewrite: {
      "^/reports": ""
    }
  }
]

module.exports = PROXY_CONFIG;
=======
const PROXY_CONFIG = [
  {
    context: [
      "/weatherforecast",
    ],
    target: "https://localhost:7155",
    secure: false
  },
  {
    context: [
      "/reports",
      "/Finance",
      "/Payroll",
      "/Accounting",
      "/Inventory",
      "/Master",
      "/EmployeeResignedList.aspx",
      "/Default.aspx",
      "/CrystalReport1.rpt"
    ],
    target: "http://localhost:8080",
    secure: false,
    pathRewrite: {
      "^/reports": ""
    }
  }
]

module.exports = PROXY_CONFIG;
>>>>>>> 5207b82f409ea4dcb09404b90ab7324a99cbff87
