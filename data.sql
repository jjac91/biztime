\c biztime
DROP TABLE IF EXISTS industry_tags;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;



CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

CREATE TABLE industries(
  code text PRIMARY KEY,
  industry text NOT NULL UNIQUE
);

INSERT INTO industries
 VALUES('tech', 'technology'),
        ('data', 'data information');

CREATE TABLE industry_tags (
comp_code text NOT NULL,
industry_code text NOT NULL,
FOREIGN KEY (comp_code) REFERENCES companies(code) ON DELETE CASCADE,
FOREIGN KEY (industry_code) REFERENCES industries(code) ON DELETE CASCADE,
PRIMARY KEY (comp_code, industry_code)
);

INSERT INTO industry_tags (comp_code, industry_code)
  VALUES('ibm', 'tech'),
        ('ibm', 'data'),
        ('apple', 'data');