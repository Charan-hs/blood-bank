const bodyParser = require("body-parser");
const express = require("express");
const app = express();
var cors = require('cors')
const blood = require("./blood.json");
const db = require("./db");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// const { query } = require("./db");
// const { request } = require("express");

app.use(cors())
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.get("/", (req, res) => {
  var token = req.cookies.jwt;
  var verifyed = {
    id: {
      name: "",
      email: "",
      role: "",
    },
  };
  if (token) {
    verifyed = jwt.verify(token, "123");
    console.log(verifyed.id);
  }
const q = "SELECT * FROM campaign "
db.query(q,(err,result) => {
  if(err){
    console.log(err)
    res.redirect('/')
  }else {
    console.log(result)
    res.render("home", {
      blood1: blood.blood,
      user: verifyed.id,
      campaign:Object.values(
        JSON.parse(JSON.stringify(result))) || ""
    });
  }
})
  
});

app.post("/", (req, res) => {
  console.log("post");
  console.log(req.body);
});

app.get("/login", (req, res) => {
  res.render("login", { message: "" });
});

app.post("/login", (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("login", { message: "All feilds are requied" });
  }
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        return res.status(202).render("login", { message: "Error occured" });
      } else {
        if (result.length > 0) {
          if (result[0].password === password) {
            const id = {
              name: result[0].name,
              email: result[0].email,
              role: result[0].role,
            };

            const token = jwt.sign({ id }, "123");
            console.log("The Token is " + token);

            const cookieOptions = {
              expires: new Date(Date.now() + 90 * 24 * 60 * 60),
              httpsOnly: true,
            };
            res.cookie("jwt", token, cookieOptions);
            return res.redirect("/");
          }
        }
      }
    }
  );
});

app.get("/register", (req, res) => {
  res.render("register", {
    blood1: blood.blood,
    message: "",
  });
});

app.post("/register", (req, res) => {
  // console.log(req.body);
  const {
    name,
    email,
    age,
    password,
    weight,
    conPass,
    phone,
    gender,
    pincode,
    address,
  } = req.body;
  const bloodin = req.body["blood"] || "";
  if (
    name.length === 0 ||
    email.length === 0 ||
    age.length === 0 ||
    password.length === 0 ||
    weight.length === 0 ||
    conPass.length === 0 ||
    phone.length === 0 ||
    pincode.length === 0 ||
    address.length === 0 ||
    bloodin.length === 0 ||
    gender.length === 0
  ) {
    return res.render("register", {
      blood1: blood.blood,
      message: "All fields are required",
    });
  }

  if (name.length < 4) {
    return res.render("register", {
      blood1: blood.blood,
      message: "Name must be 4 charecter long",
    });
  }
  if (email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const result = re.test(String(email).toLowerCase());
    if (!result) {
      return res.render("register", {
        blood1: blood.blood,
        message: "Email is not valid",
      });
    }
  }

  if (phone.length != 10) {
    return res.render("register", {
      blood1: blood.blood,
      message: "Phone Number is not valid",
    });
  }

  if (age < 16 || age > 65) {
    return res.render("register", {
      blood1: blood.blood,
      message: "Age Group must be in between 16-65",
    });
  }

  if (weight < 50) {
    return res.render("register", {
      blood1: blood.blood,
      message: "Weight must be greater then 50kgs",
    });
  }
  if (password != conPass) {
    return res.render("register", {
      blood1: blood.blood,
      message: "password did not match",
    });
  }

  if (pincode.length != 6) {
    return res.render("register", {
      blood1: blood.blood,
      message: "Pincode is not valid",
    });
  } else {
    db.query(
      "SELECT email FROM users WHERE email = ?",
      [email],
      (err, result) => {
        if (err) {
          console.log(err);
        }
        if (result.length > 0) {
          return res.render("register", {
            blood1: blood.blood,
            message: "Email is already registered please login",
          });
        }
      }
    );
    db.query(
      "INSERT INTO users SET ?",
      { email: email, password: password, role: "donar", name: name },
      async (err, results) => {
        if (err) {
          console.log("user error",err);
        } else {
          // console.log(results);
          console.log(results);
          const u = await db.query(
            "INSERT INTO donar SET ?",
            {
              name: name,
              email: email,
              age: age,
              gender: gender,
              weight: weight,
              blood: bloodin,
              phone: phone,
              pincode: pincode,
              address: address,
            },
            (err1, results1) => {
              if ("errpr ",
                err1) {
                console.log(err1);
                db.query(
                  "DELETE FROM users WHERE email = ?",
                  [email],
                  (e, r) => {
                    if (e) {
                      console.log(e);
                    } else {
                      // console.log(r)
                    }
                  }
                );
              } else {
                // console.log(results1);
                // const token = jwt.sign(id)
                const id = {
                  name,
                  email,
                  role: "donar",
                };

                const token = jwt.sign({ id }, "123");
                console.log("The Token is " + token);

                const cookieOptions = {
                  expires: new Date(Date.now() + 90 * 24 * 60 * 60),
                  httpsOnly: true,
                };

                res.cookie("jwt", token, cookieOptions);
                return res.redirect("/");

                // return res.render("register", {
                //   blood1: blood.blood,
                //   message: "Registed ",
                // });
              }
            }
          );
        }
      }
    );
  }
});

app.get("/logout", (req, res) => {
  res.cookie("jwt", "");
  return res.redirect("/");
});

app.get("/profile", async (req, res) => {
  var token = req.cookies.jwt;
  var verifyed = {
    id: {
      name: "",
      email: "",
      role: "",
    },
  };
  if (token) {
    verifyed = jwt.verify(token, "123");
    // console.log(verifyed.id);
    if (verifyed.id.name) {
      var q =
        "SELECT * FROM " +
        verifyed.id.role +
        " WHERE email = ?; SELECT * FROM reserve WHERE email = ?;SELECT * FROM request WHERE role = 'hospital';SELECT * FROM campaign WHERE email = ?;SELECT * FROM find WHERE email = ?";
      await db.query(
        q,
        [verifyed.id.email, verifyed.id.email,verifyed.id.email,verifyed.id.email],
        async (err1, results1) => {
          if (err1) {
            console.log(err1);
          } else {
            // console.log(results1[0]);
            var reserve = results1[1][0];
            if (!results1[1][0]) {
              reserve = {
                "A+": 0,
                "A-": 0,
                "B+": 0,
                "B-": 0,
                "AB+": 0,
                "AB-": 0,
                "O+": 0,
                "O-": 0,
              };
            }
            if (verifyed.id.role === "donar") {
              console.log(results1[4])
              return res.render("profile", {
                user: verifyed.id,
                data: results1[0][0],
                find:results1[4]
              });
            } else if (verifyed.id.role === "superadmin") {
              const statement = "SELECT * FROM bank; SELECT * FROM hospital;";
              db.query(statement, (errs, resultS, feilds) => {
                if (errs) {
                  console.log(errs);
                } else {
                  var foundBank = Object.values(
                    JSON.parse(JSON.stringify(resultS[0]))
                  );
                  var foundHos = Object.values(
                    JSON.parse(JSON.stringify(resultS[1]))
                  );
                  // console.log(foundHos,'\n',foundBank)
                  return res.render("superadmin", {
                    user: verifyed.id,
                    data: results1[0],
                    bank: foundBank,
                    hospital: foundHos,
                  });
                }
              });
            } else if (verifyed.id.role === "hospital") {
              console.log(results1[1][0], "d");
              return res.render("hospital", {
                user: verifyed.id,
                data: results1[0][0],
                reserve: reserve,
                find:results1[4],
                msg: "",
                errmsg: "",
                request: "",
                campaign:Object.values(
                  JSON.parse(JSON.stringify(results1[3]))) || ""
              });
            } else if (verifyed.id.role === "bank") {
              console.log(Object.values(
                JSON.parse(JSON.stringify(results1[3]))));
              return res.render("hospital", {
                user: verifyed.id,
                data: results1[0][0] || "",
                reserve: reserve || "",
                request: results1[2][0] || "",
                campaign:Object.values(
                  JSON.parse(JSON.stringify(results1[3]))) || "",
                  find:results1[4]
              });
            }
          }
        }
      );
    }
  } else {
    res.redirect("/");
  }
});

app.get("/edit/:path/:id", (req, res) => {
  const { path, id } = req.params;

  const q = "SELECT * FROM path WHERE email = ?; SELECT * FROM users WHERE email = ?".replace(
    "path",
    path
  );
  db.query(q, [id, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.redirect("/");
    } else {
      console.log(result[0][0]);
      res.render("edit", {
        message: "",
        bank: result[0][0],
        user: result[1][0],
        path: path,
      });
    }
  });
});

app.post("/edit/:path/", (req, res) => {
  var { name, email, password, conPass, phone, pincode, address } = req.body;

  // if(req.params.path=== "hospital") {
  //   console.log("heyyy")
  //   return res.redirect('/')
  // }
  const path1 = req.params.path;
  const q = "SELECT * FROM users WHERE email = ?; SELECT * FROM path WHERE email = ?".replace(
    "path",
    path1
  );
  db.query(q, [email, email], async (err, result) => {
    if (err) {
      console.log("1", err);
      return res.redirect("/");
    } else {
      const user = result[0][0];
      const data = result[1][0];
      // console.log(data)
      if (name.length < 3) {
        return res.render("edit", {
          message: "Length must be 4 charecter long",
          bank: data,
          user: user,
        });
      }
      if (password != conPass) {
        return res.render("edit", {
          message: "Password must be same",
          bank: data,
          user: user,
        });
      }
      if (phone.length != 10) {
        return res.render("edit", {
          message: "Phone Number is not valid",
          bank: data,
          user: user,
        });
      }
      if (pincode.length != 6) {
        return res.render("edit", {
          message: "Pincode is not valid",
          bank: data,
          user: user,
        });
      }

      name = name || data.name;
      phone = phone || data.phone;
      pincode = pincode || data.pincode;
      address = address || data.address;

      const q1 = "UPDATE users SET password = ? WHERE email = ?; UPDATE bank SET name = ? , phone = ?, pincode = ? , address = ? WHERE email = ?".replace(
        "bank",
        path1 === "hospital" ? "hospital" : "bank"
      );
      await db.query(
        q1,
        [password, email, name, phone, pincode, address, email],
        (err1, result1) => {
          if (err1) {
            console.log("2", err);
            return res.redirect("/");
          } else {
            // console.log("Changed successfully")
            // console.log("3",result1)
            return res.redirect("/");
          }
        }
      );
    }
  });
});

app.get("/delete/:path/:id", (req, res) => {
  const path = req.params.path;
  const id = req.params.id;
  var token = req.cookies.jwt;
  var verifyed = {
    id: {
      name: "",
      email: "",
      role: "",
    },
  };
  if (token) {
    verifyed = jwt.verify(token, "123");
    if (verifyed.id) {
      const q = "DELETE FROM users WHERE email = ?";
      db.query(q, [id], (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log("success fully deleted");
          res.redirect("/profile");
        }
      });
    }
  }
});

app.get("/add/:path/", (req, res) => {
  res.render("add", { message: "", path: req.params.path });
});

app.post("/add/:path/", (req, res) => {
  var { name, email, password, conPass, phone, pincode, address } = req.body;
  if (
    name.length === 0 ||
    email.length === 0 ||
    password.length === 0 ||
    conPass.length === 0 ||
    phone.length === 0 ||
    pincode.length === 0 ||
    address.length === 0
  ) {
    return res.render("add", {
      message: "All fields are required",
      path: req.params.path,
    });
  }
  if (name.length < 3) {
    return res.render("add", {
      message: "Length must be 4 charecter long",
      path: req.params.path,
    });
  }
  if (password != conPass) {
    return res.render("add", {
      message: "Password must be same",
      path: req.params.path,
    });
  }
  if (phone.length != 10) {
    return res.render("add", {
      message: "Phone Number is not valid",
      path: req.params.path,
    });
  }
  if (pincode.length != 6) {
    return res.render("add", {
      message: "Pincode is not valid",
      path: req.params.path,
    });
  }
  if (email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const result = re.test(String(email).toLowerCase());
    if (!result) {
      return res.render("add", {
        path: req.params.path,
        message: "Email is not valid",
      });
    }
  }
  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result.length > 0) {
        return res.render("add", {
          path: req.params.path,
          message: "Email is already registered please login",
        });
      }
    }
  );

  const q = "INSERT INTO users SET ?";

  db.query(
    q,
    { email: email, password: password, role: req.params.path, name: name },
    (err, result) => {
      if (err) {
        console.log(err);
        return res.render("add", {
          path: req.params.path,
          message: "Try again",
        });
      } else {
        const qq = "INSERT INTO path SET ?".replace("path", req.params.path);
        db.query(
          qq,
          {
            name: name,
            email: email,
            phone: phone,
            pincode: pincode,
            address: address,
          },
          (err1, result1) => {
            if (err1) {
              console.log(err1);
              res.redirect("/profile");
            } else {
              res.redirect("/profile");
            }
          }
        );
      }
    }
  );
});

app.get("/view/:path/:id", (req, res) => {
  const path = req.params.path;
  const email = req.params.id;
  const q = "SELECT * FROM path WHERE email = ?;SELECT * FROM reserve WHERE email = ?;SELECT * FROM users WHERE email = ?".replace(
    "path",
    path
  );
  db.query(q, [email, email, email], (err, result) => {
    if (err) {
      console.log("1", err);
      return res.redirect("/");
    } else {
      // console.log(result[1][0]['A+'] ,q)
      var reserve = result[1][0];
      if (!result[1][0]) {
        reserve = {
          "A+": 0,
          "A-": 0,
          "B+": 0,
          "B-": 0,
          "AB+": 0,
          "AB-": 0,
          "O+": 0,
          "O-": 0,
        };
      }
      res.render("superbhview", {
        reserve: reserve,
        user: result[2][0],
        data: result[0][0],
      });
    }
  });
});

app.post("/blood/:path/:id", (req, res) => {
  const { path, id } = req.params;
  const data = req.body;
  const q =
    "UPDATE reserve SET  `A+` = ? , `A-` = ?, `B+` = ? , `B-` = ? ,`AB+` = ? ,`AB-` = ? ,`O+` = ? , `O-` = ? WHERE email = ?";
  db.query(
    q,
    [
      data["A+"],
      data["A-"],
      data["B+"],
      data["B-"],
      data["AB+"],
      data["AB-"],
      data["O+"],
      data["O-"],
      id,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        res.redirect("/profile");
      } else {
        res.redirect("/profile");
      }
    }
  );
});

app.post("/request/:path/:id", (req, res) => {
  console.log(req.body);
  const q = "INSERT INTO request SET ?";
  db.query(q, [req.body], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      res.redirect("/profile");
    }
  });
});

app.get("/up/request/checkout/:id/:email", (req, res) => {
  const email = req.params.id;
  const reqEmail = req.params.email;
  const q =
    "SELECT * FROM request WHERE email = ?; SELECT * FROM reserve where email = ?; SELECT * FROM reserve WHERE email = ?";

  db.query(q, [email, reqEmail,email], (err, result) => {
    if (err) {
      console.log(err);
      res.redirect("/profile");
    } else {
      var check = result[0][0];
      var save = result[1][0];
      var pre = result[2][0];
      var keys = Object.keys(save);
      var che = false;
      keys.map((val) => {
        if (val != "email") {
          let h = save[val]
          save[val] = save[val] - check[val] < 0 ? 0 : save[val] - check[val];
          pre[val] = pre[val] + (((h - check[val]) < 0) ? h : check[val]);
          check[val] = h - check[val] < 0 ? check[val] - h : 0;
        }
      });
      for(var i=0;i<keys.length;i++){
        if(keys[i] !='email'){
          if(check[keys[i]] > 0){
            che = true;
            break;
          }
        }
      }
    

      if (!che) {
        const s =
          "UPDATE reserve SET ? WHERE email = ? ;DELETE FROM request WHERE email = ? ;UPDATE reserve SET ? WHERE email = ?";

        db.query(s, [save, reqEmail, email,pre,email], (err, resu) => {
          if (err) {
            console.log(err);
            res.redirect("/profile");
          } else {
            res.redirect("/profile");
          }
        });
      } else {
        const s =
          "UPDATE reserve SET ? WHERE email = ? ;UPDATE request SET ? WHERE email = ?;UPDATE reserve SET ? WHERE email = ? ";
        db.query(s, [save, reqEmail, check, email,pre,email], (err, resu) => {
          if (err) {
            console.log(err);
            res.redirect("/profile");
          } else {
            res.redirect("/profile");
          }
        });
      }
    }
  });
});


app.get('/up/campaign/:id' , (req,res) => {
  const email = req.params.id
  res.render('campaign',{email:email,message:""})
})

app.post('/up/campaign',(req,res) => {
  const data = req.body
  q= 'INSERT INTO campaign SET ?'
  db.query(q,[data],(err,result) => {
    if(err){
      console.log(err)
      res.redirect('/profile')
    }else{
      console.log(result)
      res.redirect('/profile')
    }
  })
  
})

app.get('/up/edit/campaign/:id',(req,res) => {
        const q = "SELECT * FROM campaign WHERE email = ?"
        db.query(q,[req.params.id],(err,result) => {
          if(err){
            console.log(err)
            res.redirect('/profile')
          }else{
            res.render('editCampaign',{email:req.params.id,message:"",result:result[0]})
          }
        })
})

app.post('/up/edit/campaign',(req,res) => {
  const q = "UPDATE campaign SET ?"
  db.query(q,[req.body],(err,request)=> {
    if(err){
      console.log(err)
      res.redirect('/profile')
    }else{
      res.redirect('/profile')
    }
  })
})

app.get("/up/delete/campaign/:id",(req,res) => {
  const email = req.params.id
  const q  = "DELETE FROM campaign WHERE email= ?"
  db.query(q,[email],(err,result) => {
    if(err){
      console.log(err)
      res.redirect('/profile')
    }else {
      res.redirect('/profile')
    }
  })
})


app.post('/find',(req,res) => {
  const {blood,pincode,name,phone} = req.body
  const q = "SELECT * FROM donar WHERE pincode = ? AND blood = ? ; SELECT * FROM  hospital WHERE pincode = ? ; SELECT * FROM  bank WHERE pincode = ? ;"
  db.query(q,[pincode,blood,pincode,pincode],(err,result) => {
    if(err){
      console.log(err)
      res.redirect('/')

    }else {
      const donar = result[0]

      const hospital = result[1]
      const bank = result[2]
      res.render('find',{name,phone,
        blood,pincode,donar:result[0],hospital:result[1],bank:result[2]
      })
      
    }
  })
})

app.get('/finddata/:name/:pincode/:blood/:phone/:email',(req,res) => {

  console.log(req.params)
  const q = "INSERT INTO find SET ?"
  db.query(q,[req.params],(err,result) => {
    if(err){
      console.log(err)
      res.redirect('/')
    }else {
        res.redirect('/')
    }
  })
})

app.get('/delfind/finddata/:email',(req,res) => {
  const email = req.params.email
  const q = "DELETE FROM find WHERE email = ? "
  db.query(q,[email],(err,result)=> {
    if(err){
      console.log(err)
      res.redirect('/')
    }else {
      res.redirect('/profile')
    }
  })
})

app.get('',(req,res) => {
  res.redirect('/')
})

app.listen(process.env.PORT || 3000, () => console.log("server started "));
