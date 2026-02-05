const { addAboutSection, getAbout, updateAbout, deleteAbout } = require('../controllers/AboutController')
const upload = require('../middleware/fileUpload')

const router = require('express').Router()

router.post('/add', upload.single('image-about'), addAboutSection)
router.get('/get', getAbout)
router.put('/update',upload.single('image-about'), updateAbout)
router.delete('/delete/:id', deleteAbout)

module.exports = router