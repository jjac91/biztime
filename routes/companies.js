const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
  try {
    const companiesQuery = await db.query("SELECT code, name FROM companies");
    return res.json({ companies: companiesQuery.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const companiesQuery = await db.query(
      `SELECT c.code, c.name, c.description, i.industry 
        FROM companies AS c 
        LEFT JOIN industry_tags AS it 
          ON c.code = it.comp_code
        LEFT JOIN industries AS i ON it.industry_code = i.code 
        WHERE c.code = $1`,
      [req.params.code]
    );

    const invoicesQuery = await db.query(
      "SELECT id FROM invoices WHERE comp_code =$1",
      [req.params.code]
    );

    if (companiesQuery.rows.length === 0) {
      let notFoundError = new Error(
        `There is no company with id '${req.params.id}`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }
    
    const company = companiesQuery.rows[0];
    const invoices = invoicesQuery.rows;
    company.invoices = invoices.map((inv) => inv.id);
    company.industry = companiesQuery.rows.map(r => r.industry)
    return res.json({ company: company });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    let code = slugify(name, { lower: true });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
         VALUES ($1,$2,$3) 
         RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    const code = req.params.code;
    const result = await db.query(
      `UPDATE companies
           SET name=$2, description =$3
           WHERE code = $1
           RETURNING code, name, description`,
      [code, name, description]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${code}`, 404);
    }

    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    const result = await db.query(
      "DELETE FROM companies WHERE code = $1 RETURNING code",
      [code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${code}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
