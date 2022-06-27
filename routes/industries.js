const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.post("/", async function (req, res, next) {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry) 
           VALUES ($1,$2) 
           RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.get("/", async function (req, res, next) {
  try {
    const industriesQuery = await db.query(
      `SELECT i.code, i.industry, c.code AS comp_code
    FROM industries AS i 
    LEFT JOIN industry_tags AS it 
      ON i.code = it.industry_code
    LEFT JOIN companies AS c 
        ON it.comp_code = c.code `
    );
    let result =[]
    for(row of industriesQuery.rows){
      console.log(row)
      if (!result.some(industry => industry.industry_code === row.code)){
        result.push({industry_code : row.code,
        industry : row.industry,
        comp_code : [row.comp_code]})
      }
      if(result.some(industry => industry.industry_code === row.code)){
        let industryToBeAppended = result.find(industry => industry.industry_code === row.code)
        if(!industryToBeAppended.comp_code.includes(row.comp_code))
        industryToBeAppended.comp_code.push(row.comp_code)
      }
      
    }
    console.log(result)
    return res.json({industries: result});
  } catch (err) {
    return next(err);
  }
});

router.post("/tag", async function (req, res, next) {
    try {
        const { comp_code, industry_code } = req.body;
        const result = await db.query(
            `INSERT INTO industry_tags (comp_code, industry_code)
                VALUES ($1, $2)
                RETURNING comp_code, industry_code`,
                [comp_code, industry_code]
        )
        return res.status(201).json({tag : result.rows[0]})
    }
    catch(err){
        return next(err)
    }
})

module.exports = router;
