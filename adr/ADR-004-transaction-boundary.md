
---

Transaction yönetimini **service katmanında** yaparız.

Neden controller’da yapmayız?
Çünkü controller’da HTTP isteklerini karşılarız, ancak DB işlemlerini yapmayız.

Repository katmanında da yapamayız;
çünkü repository transaction bilmez.

---

## Trade-offs

* Service katmanının karmaşıklığı artar
* Ancak veri tutarlılığı garanti altına alınır

---
