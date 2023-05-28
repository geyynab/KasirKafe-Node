//import express
const express = require("express")
const app = express()
app.use(express.json())

//import multer
const multer = require("multer")
const path = require("path")
const fs = require("fs")

//import model
const models = require("../models/index")
const menu = models.menu

//config storage image
const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,"./gambar/menu")
    },
    filename: (req,file,cb) => {
        cb(null, "img-" + Date.now() + path.extname(file.originalname))
    }
})
let upload = multer({storage: storage})

app.get("/", auth, (req, res) => {
    menu.findAll()
        .then(result => {
            res.json({
                menu : result
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

app.get("/:id_menu", auth, (req, res) =>{
    menu.findOne({where: {id_menu: req.params.id_menu}})
    .then(result => {
        res.json({
            menu: result
        })
    })
    .catch(error => {
        res.json({
            message: error.message
        })
    })
})

app.get("/jenis/:jenis", auth, async(req, res) => {
    const param = { jenis: req.params.jenis}
    menu.findAll({where: {jenis: param.jenis}})
        .then(result => {
            res.json({
                menu : result
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

app.post("/", auth, upload.single("gambar"), (req, res) =>{
    if (!req.file) {
        res.json({
            message: "No uploaded file"
        })
    } else {
        let data = {
            nama_menu: req.body.nama_menu,
            jenis: req.body.jenis,
            deskripsi: req.body.deskripsi,
            gambar: req.file.filename,
            harga: req.body.harga
        }
        menu.create(data)
        .then(result => {
            res.json({
                message: "data has been inserted"
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
    }
})

app.put("/:id", auth, upload.single("gambar"), (req, res) =>{
    let param = { id_menu: req.params.id}
    let data = {
        nama_menu: req.body.nama_menu,
        jenis: req.body.jenis,
        deskripsi: req.body.deskripsi,
        harga: req.body.harga
    }
    if (req.file) {
        // get data by id
        const row = menu.findOne({where: param})
        .then(result => {
            let oldFileName = result.gambar
           
            // delete old file
            let dir = path.join(__dirname,"../gambar/menu",oldFileName)
            fs.unlink(dir, err => console.log(err))
        })
        .catch(error => {
            console.log(error.message);
        })

        // set new filename
        data.gambar = req.file.filename
    }

    menu.update(data, {where: param})
        .then(result => {
            res.json({
                message: "data has been updated",
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})

app.delete("/:id", auth, async (req, res) =>{
    try {
        let param = { id_menu: req.params.id}
        let result = await menu.findOne({where: param})
        let oldFileName = result.gambar
           
        // delete old file
        let dir = path.join(__dirname,"../gambar/menu",oldFileName)
        fs.unlink(dir, err => console.log(err))

        // delete data
        menu.destroy({where: param})
        .then(result => {
           
            res.json({
                message: "data has been deleted",
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })

    } catch (error) {
        res.json({
            message: error.message
        })
    }
})

module.exports = app