const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
  try {
    const invoicesQuery = await db.query("SELECT id, comp_code FROM invoices");
    return res.json({ invoices: invoicesQuery.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const invoicesQuery = await db.query(
      `SELECT invoices.id,
             invoices.comp_code,
             invoices.amt, 
             invoices.paid, 
             invoices.add_date, 
             invoices.paid_date, 
             companies.name,
             companies.description
        FROM invoices AS invoices
             INNER JOIN companies AS companies ON (invoices.comp_code = companies.code)
        WHERE id = $1`,
      [req.params.id]
    );

    if (invoicesQuery.rows.length === 0) {
      let notFoundError = new Error(
        `There is no invoice with id ${req.params.id}`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }
    const queryResults = invoicesQuery.rows[0];
    const invoice = {
      id: queryResults.id,
      amt: queryResults.amt,
      paid: queryResults.paid,
      add_date: queryResults.add_date,
      paid_date: queryResults.paid_date,
      company: {
        code: queryResults.comp_code,
        name: queryResults.name,
        description: queryResults.description,
      },
    };
    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
         VALUES ($1,$2) 
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const { amt } = req.body;
    const id = req.params.id;
    const result = await db.query(
      `UPDATE invoices
           SET amt=$2
           WHERE id = $1
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [id, amt]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with id of '${id}`, 404);
    }

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const result = await db.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of '${id}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
