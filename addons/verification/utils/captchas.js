module.exports = {
  getCaptcha
}

async function getCaptcha() {
  const captchasFiles = [{
      url: 'https://i.imgur.com/6OjVj2u.png',
      code: 'A737BA'
    },{
      url: 'https://i.imgur.com/p4sxXiE.png',
      code: '1E8A93'
    },{
      url: 'https://i.imgur.com/Z4DbjEm.png',
      code: '50898C'
    },{
      url: 'https://i.imgur.com/wXmOnNO.png',
      code: 'DA3AA4'
    },{
      url: 'https://i.imgur.com/ZQHuuIr.png',
      code: '02F34F'
    },{
      url: 'https://i.imgur.com/ZTTFvTp.png',
      code: 'BA3AE9'
    },{
      url: 'https://i.imgur.com/Bq2hgvz.png',
      code: '9D5200'
    },{
      url: 'https://i.imgur.com/M6h0Xlf.png',
      code: '1FA016'
    },{
      url: 'https://i.imgur.com/9woFIHG.png',
      code: '1AAF8C'
    },{
      url: 'https://i.imgur.com/Qnp5GL1.png',
      code: 'CBF8B3'
    }]
    
  const random = Math.floor(Math.random() * captchasFiles.length)
    
  return captchasFiles[random]
}