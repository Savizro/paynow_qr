function pad(n, width=2, z='0') { n = n + ''; return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n; }

function makePaynowQR({type, value, amount}) {
  let tags = [
    { id: '00', value: '01' },
    { id: '01', value: '12' },
    { id: '26', value: [
      { id: '00', value: 'A000000727' },
      { id: '01', value: type === "mobile" ? '0' : '2' },
      { id: '02', value },
    ]},
    { id: '52', value: '0000' },
    { id: '53', value: '702' },
    ...(amount ? [{ id: '54', value: parseFloat(amount).toFixed(2) }] : []),
    { id: '58', value: 'SG' },
    { id: '59', value: 'PAYNOW' },
    { id: '60', value: 'Singapore' },
  ];

  function formatTag(id, value) {
    if (Array.isArray(value)) {
      value = value.map(x => formatTag(x.id, x.value)).join('');
    }
    return id + pad(value.length) + value;
  }
  let qr = tags.map(t => formatTag(t.id, t.value)).join('');
  qr += '6304';
  
  function crc16ccitt(str) {
    let crc = 0xFFFF;
    for (let c of str) {
      crc ^= c.charCodeAt(0) << 8;
      for (let i = 0; i < 8; i++)
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return pad(crc.toString(16).toUpperCase(), 4);
  }

  qr += crc16ccitt(qr);
  return qr;
}

function updateUI() {
  const type = document.querySelector('input[name="type"]:checked').value;
  const phone = document.getElementById('phone').value.trim();
  const uen = document.getElementById('uen').value.trim().toUpperCase();
  const amount = document.getElementById('amount').value;
  document.getElementById('phoneRow').style.display = (type === "mobile") ? '' : 'none';
  document.getElementById('uenRow').style.display = (type === "uen") ? '' : 'none';
  let isReady = false, qrData = "";
  
  if (type === "mobile" && /^\d{8,12}$/.test(phone)) {
    isReady = true; qrData = makePaynowQR({type, value: phone, amount});
  }
  if (type === "uen" && /^[A-Z0-9]{8,20}$/.test(uen)) {
    isReady = true; qrData = makePaynowQR({type, value: uen, amount});
  }
  
  const qrcodeDiv = document.getElementById('qrcode');
  qrcodeDiv.innerHTML = "";
  
  if (isReady) {
    new QRCode(qrcodeDiv, {
      text: qrData,
      width: 220,
      height: 220,
      colorDark: "#000",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrcodeDiv.innerHTML = '<div class="placeholder">Enter details to generate QR</div>';
  }
  
  document.getElementById('printBtn').disabled = !isReady;
}
['phone', 'uen', 'amount'].forEach(id =>
  document.getElementById(id).addEventListener('input', updateUI));
document.querySelectorAll('input[name="type"]').forEach(el =>
  el.addEventListener('change', updateUI));
document.getElementById('printBtn').addEventListener('click', function() {
  window.print();
});

updateUI();