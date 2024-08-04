const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
require("chromedriver");
const swd = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const tableSelector = 'table[border="1"][align="center"][style*="width:100%"]';
// console.log(process.env.USER);

const tab = new swd.Builder().forBrowser("chrome").build();
const Opentab = tab.get("https://academic.iitm.ac.in/");

Opentab.then(() => tab.manage().setTimeouts({ implicit: 1000 })).then(() =>
  tab
    .findElement(
      swd.By.xpath("/html/body/div/div[3]/div/div[1]/div[3]/form/div[1]/input")
    )
    .then((username) => username.sendKeys(process.env.USER))
    .then(() =>
      tab.findElement(
        swd.By.xpath(
          "/html/body/div/div[3]/div/div[1]/div[3]/form/div[2]/input"
        )
      )
    )
    .then((pwd) => pwd.sendKeys(process.env.PWD))
    .then(() =>
      tab.findElement(
        swd.By.xpath(
          "/html/body/div/div[3]/div/div[1]/div[3]/form/div[3]/div/input"
        )
      )
    )
    .then((login) => login.click())
    .then(() =>
      tab.findElement(
        swd.By.xpath("/html/body/div[1]/div/div/div/div[3]/button")
      )
    )
    .then((submit) => submit.click())
    .then(() =>
      tab.findElement(
        swd.By.xpath("/html/body/div/div[2]/div/nav/div[2]/ul[1]/li[3]/a")
      )
    )
    .then((course) => course.click())
    .then(() =>
      tab.findElement(
        swd.By.xpath(
          "/html/body/div/div[2]/div/nav/div[2]/ul[1]/li[3]/ul/li[6]/a"
        )
      )
    )
    .then((grades) => grades.click())
    .then(async () => {
      let tables = await tab.findElements(swd.By.css(tableSelector));
      let allData = [];
      const table_prom = tables.map(async (table) => {
        let tdElements = await table.findElements(swd.By.css("td"));
        const td_prom = tdElements.map(async (td) => {
          let text = await td.getText();
          let fontColor = await tab.executeScript(
            "return window.getComputedStyle(arguments[0]).color;",
            td
          );
          return { text: text.trim(), fontColor };
        });
        const td_data = await Promise.all(td_prom);
        return td_data;
      });
      allData = await Promise.all(table_prom);
      return allData;
    })
    .then((data) => {
      let reorg_data = [];
      let flag = true;

      for (let i = 0; i < data.length; i++) {
        let ele = data[i];
        if (ele.length == 0) continue;
        if (ele.length == 1 && i < data.length - 3) {
          if (flag) {
            reorg_data.push({});
            let sem = ele[0].text;
            reorg_data[reorg_data.length - 1].name = sem;
            reorg_data[reorg_data.length - 1].courses = [];
            flag = !flag;
          } else {
            reorg_data[reorg_data.length - 1].gpa = ele[0].text
              .split(" ")[2]
              .split(":")[1];
            reorg_data[reorg_data.length - 1].cgpa = ele[0].text
              .split(" ")[3]
              .split(":")[1];
            flag = !flag;
          }
        } else if (ele.length > 1 && i < data.length - 1) {
          reorg_data[reorg_data.length - 1].courses.push({
            code: ele[1].text,
            name: ele[2].text,
            category: ele[3].text,
            credits: ele[4].text,
            grade: ele[5].text,
            attendance: ele[6].text,
          });
        } else {
          if (ele.length == 1) {
            reorg_data.push({});
            reorg_data[reorg_data.length - 1].name = ele[0].text;
            reorg_data[reorg_data.length - 1].credits = {};
          } else {
            reorg_data[reorg_data.length - 1].credits.engineering = ele[1].text;
            reorg_data[reorg_data.length - 1].credits.professional =
              ele[2].text;
            reorg_data[reorg_data.length - 1].credits.science = ele[3].text;
            reorg_data[reorg_data.length - 1].credits.humanities = ele[4].text;
            reorg_data[reorg_data.length - 1].credits.others = ele[5].text;
          }
        }
      }
      console.log(reorg_data);
      return reorg_data;
    })
    .then(() => tab.close())
    .then(() => {
      console.log("the automation is successful");
      setTimeout(() => process.exit(0), 2000);
    })
);
