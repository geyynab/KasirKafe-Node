//import express
const express = require("express");
const app = express();
app.use(express.json());

//import model
const models = require("../models/index");
const transaksi = models.transaksi;
const detail_transaksi = models.detail_transaksi;
const menu = models.menu;
const meja = models.meja;
const user = models.user;
const { Op } = models.Sequelize;

// import auth
const auth = require("../auth");
app.use(auth);

app.get("/", auth, async (req, res) => {
  let result = await transaksi.findAll({
    include: [
      "user", "meja",
      {
        model: models.detail_transaksi,
        as: "detail_transaksi",
        include: ["menu"],
      },
    ],
  });
  res.json({transaksi: result});
});

app.get("/:id_transaksi",  auth, async (req, res) => {
  let param = { id_transaksi: req.params.id_transaksi };
  let result = await transaksi.findAll({
    where: param,
    include: [
      "user", "meja",
      {
        model: models.detail_transaksi,
        as: "detail_transaksi",
        include: ["menu"],
      },
    ],
  });
  res.json({
    transaksi:result
  });
});

app.get("/user/:id_user", auth, async (req, res) => {
  let param = { id_user: req.params.id_user };
  let result = await transaksi.findAll({
    where: param,
    include: [
      "user",
      "meja",
      {
        model: models.detail_transaksi,
        as: "detail_transaksi",
        include: ["menu"],
      },
    ],
  });
  res.json({
    transaksi: result,
  });
});


// filtering transaksi berdasarkan tgl_transaksi
app.get("/tgl_transaksi/:tgl_transaksi", auth, async (req, res) => { // endpoint untuk mencari data transaksi berdasarkan tanggal transaksi
  const param = { tgl_transaksi: req.params.tgl_transaksi }; // inisialisasi parameter yang akan dikirimkan melalui parameter

  transaksi
   .findAll({ // mengambil data transaksi berdasarkan tanggal transaksi yang dikirimkan melalui parameter
      where: {
        tgl_transaksi: {
          [Op.between]: [
            param.tgl_transaksi + " 00:00:00",
            param.tgl_transaksi + " 23:59:59",
          ], // mencari data transaksi berdasarkan tanggal transaksi yang dikirimkan melalui parameter
        }
      },
      include: [ // join tabel user dan meja
        {
          model: user,
          as: "user",
        },
        {
          model: meja,
          as: "meja",
        },
      ],
    })
    .then((result) => { // jika berhasil
      if (result.length === 0) { // jika data tidak ditemukan
        res.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
          status: "error",
          message: "data tidak ditemukan",
        });
      } else { // jika data ditemukan
        res.status(200).json({ // mengembalikan response dengan status code 200 dan pesan data ditemukan
          status: "success",
          message: "data ditemukan",
          data: result,
        });
      }
    })
    .catch((error) => { // jika gagal
      res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
        status: "error",
        message: error.message,
      });
    });
});

// filtering transaksi berdasarkan nama_user dari tabel user
app.get("/nama_user/:nama_user", auth, async (req, res) => { // endpoint untuk mencari data transaksi berdasarkan nama user
  const param = { nama_user: req.params.nama_user }; // inisialisasi parameter yang akan dikirimkan melalui parameter

  user
    .findAll({ // mengambil data user berdasarkan nama user yang dikirimkan melalui parameter
      where: {
        nama_user: param.nama_user,
      },
    })
    .then((result) => { // jika berhasil
      if (result == null) { // jika data tidak ditemukan
        res.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
          status: "error",
          message: "data tidak ditemukan",
        });
      } else { // jika data ditemukan
        transaksi
          .findAll({ // mengambil data transaksi berdasarkan id user yang dikirimkan melalui parameter
            where: {
              id_user: result[0].id_user,
            },
          })
          .then((result) => { // jika berhasil
           if (result.length === 0) { // jika data tidak ditemukan
              res.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
                status: "error",
                message: "data tidak ditemukan",
              });
            } else { // jika data ditemukan
              res.status(200).json({ // mengembalikan response dengan status code 200 dan pesan data ditemukan
                status: "success",
                message: "data ditemukan",
                data: result,
              });
            }
          })
          .catch((error) => { // jika gagal
            res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
              status: "error",
              message: error.message,
            });
          });
      }
    })
    .catch((error) => { // jika gagal
      res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
        status: "error",
        message: error.message,
      });
    });
});


app.post("/", auth, async (req, res) => {
  let current = new Date().toISOString().split('T')[0]
  let data = {
      id_user: req.body.id_user,
      tgl_transaksi: current,
      id_meja: req.body.id_meja,
      nama_pelanggan: req.body.nama_pelanggan,
      status: req.body.status,
      total: req.body.total
  }
  transaksi.create(data)
      .then(result => {
          let lastID = result.id_transaksi
          console.log(lastID);
          detail = req.body.detail_transaksi
          detail.forEach(element => {
              element.id_transaksi = lastID;
          });
          console.log(detail);
          detail_transaksi.bulkCreate(detail)
              .then(result => {
                  // Update status meja menjadi tersedia
                  meja.update(
                    { status: 'tdk_tersedia' },
                    { where: { id_meja: req.body.id_meja } }
                  )
                  .then(() => {
                      res.json({
                          message: "Data has been inserted"
                      })
                  })
                  .catch(error => {
                      res.json({
                          message: error.message
                      })
                  })
              })
              .catch(error => {
                  res.json({
                      message: error.message
                  })
              })
      })
      .catch(error => {
          console.log(error.message);
      })
})


// bayar transaksi
app.put("/bayar/:id_transaksi", auth, async (req, res) => {
  const param = { id_transaksi: req.params.id_transaksi };
  console.log(param)
  
  transaksi
    .update({ status: `lunas` }, { where: param })
    .then(async (result) => {
      let dataTransaksi = await transaksi.findOne({
        where: { id_transaksi: req.params.id_transaksi },
      });

      let idMeja = dataTransaksi.id_meja
      await meja.update(
        { status: "tersedia" },
        { where: { id_meja: idMeja} }
      ); 
      res.status(200).json({
        status: "success",
        message: "data berhasil diubah",
      }); 
    })
    .catch((error) => {
      // jika gagal
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

app.delete("/:id_transaksi", auth, async (req, res) =>{
    let param = { id_transaksi: req.params.id_transaksi}
    try {
        await detail_transaksi.destroy({where: param})
        await transaksi.destroy({where: param})
        res.json({
            message : "data has been deleted"
        })
    } catch (error) {
        res.json({
            message: error
        })
    }
})

module.exports = app;