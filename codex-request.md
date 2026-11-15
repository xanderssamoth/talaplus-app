============
En ce qui concerne l'utilisateur (onglet "Profil"), voici ce qui doit être fait :
============

1️⃣ Mettre un bouton pour modifier l'avatar de l'utilisateur (juste à côté de sa photo).
API Endpoint "PATCH : https://admin.talaplus.tv/api/v1/user/{id}/avatar"
Donnée à envoyer :
- avatar_base64 : L'image en base 64

2️⃣ Au lieu de mettre le badge orange "Premium", si la valeur de "type" de sa branche API JSON est "certified", il faut placer un badge/icône "Vérifié" (comme sur les autres réseaux sociaux). Sinon, il faut mettre un bouton/icône pour vérifier ; et ce bouton/icône ouvre une fenêtre contenant :

- ETAPE 1 : Un formulaire pour joindre sa carte d'identité. API Endpoint "POST : https://admin.talaplus.tv/api/v1/user/{id}/file" avec les données à envoyer suivantes :
    -> "files" : [Un ensemble des fichiers à uploader. Un seul fichier dans notre cas.]. Pour chaque fichier (le seul fichier en l'occurrence) on a :
        ->> "file_type" : 'id_card' ;
        ->> "file_description" : [Tu mets une description en français].
⚠️ Si l'utilisateur a déjà une carte d'identité envoyée, alors l'ETAPE 1 est inutile (l'API Endpoint pour vérifier s'il a une carte d'identité envoyée est "GET : https://admin.talaplus.tv/api/v1/user/me/id-card").

- ETAPE 2 : La liste des 4 plans premium à sélectionner pour vérifier son compte (API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/premium/pricing").
En cliquant sur le bouton "Sélectionner" sur un plan premium. API Endpoint pour sélectionner : "POST : https://admin.talaplus.tv/api/v1/user/{userId}/premium/activate" ; avec les données à envoyer suivantes :
    -> "months" : [L'utilisateur a le choix entre "1", "3", "6" ou "12" qui sont des valeurs de la branche JSON "duration" depuis l'API pour la liste des 4 plans premium]. Cette donnée est cachée dans le bouton "Sélectionner" de chacun des 4 plans. Quand il clique un pop-up avec les libellés "Mode de paiement" et "Canal"
    -> "type" : [Tu mettras le libellé "Mode de paiement" pour choisir :
        ->> entre "Mobile money" (tu envoies la valeur "1")
        ->> et "Carte bancaire" (tu envoies la valeur "2")]. Les images sont dans le dossiers "assets/payment" (Le nom des fichiers est "payment-[TYPE]" pour que tu associes le numéro du type au nom du mode de paiement) ;
    -> "channel" [Tu mettras le libellé "Mode de paiement" pour choisir un canal]. Les canaux sont les suivants (Les images sont dans le dossier "assets/payment", et le nom des fichiers est "operator-[NOM DU CANAL]" pour que tu récupères le nom du canal pour mieux placer le nom et l'image) :
        ->> Afrimoney ;
        ->> Airtel money ;
        ->> M-Pesa ;
        ->> Orange money ;
        ->> Visa/Mastercard.
    -> "phone" [Tu mettras le libellé "N° de téléphone"]. Ce champs disparait quand l'utilisateur choisit "Carte bancaire" (qui enverra "type = 2" sur le serveur) et réapparait quand l'utilisateur choisit "Mobile money" (qui enverra "type = 1" sur le serveur).

En envoyant les données sur le serveur, pour type :
- Si l'utilisateur choisit "Mobile money" (valeur "1" envoyée pour "type"), tu le rédiriges vers une fenêtre contenant du contenu (centré au tout milieu) suivant :
    -> L'image "assets/payment/validate-payment.png" ;
    -> Un texte d'information "Validez le paiement sur votre téléphone et cliquez sur le bouton « OK » ci-dessous" (ne pas oublier que les textes sont en 3 languess ici et partout) ;
    -> Le fameux bouton « OK » sur lequel l'utilisateur clique après avoir validé le paiement "Mobile money" sur son téléphone.
- Si l'utilisateur choisit "Carte bancaire" (valeur "2" envoyée pour "type"), l'API doit retourner (s'il n'y a pas d'erreur) une réponse JSON contenant la branche "url" qui te servira pour rédiriger l'utilisateur vers une fenêtre contenant :
    -> Une flèche pour retourner au profil ;
    -> Un webview affichant le contenu venant l'URL de cette branche JSON "url".

Dans les cas, que l'utilisateur clique sur « OK » pour "Mobile money", ou sur flèche pour retourner pour "Carte bancaire", il retourne toujours sur le profil. Et sur ce profil (uniquement sur le profil), si la branche JSON "type" de l'utilisateur (ne pas confondre avec la donnée "type" à envoyer pour payer un plan premium) possède la valeur :
- "uncertified" : Il faut mettre un bouton/icône pour vérifier (Une icône pour montrer qu'on doit cliquer dessus)
- "certifying" : Il faut placer un badge/icône "En cours" (Horloge par exemple)
- "certified" : Il faut placer un badge/icône "Vérifié" (Badge check)

⚠️ Partout (ailleurs que sur le profil de l'utilisateur lui-même) là où il y a la photo de profil et le nom de l'utilisateur. La vérification des utilisateurs premium pour mettre un badge doit donc être en temps réel.

3️⃣ Dans le texte "Membre depuis Janv. 2024" à côté de la photo de profil, "Janv. 2024" doit être dynamique selon la valeur de "created_at"

4️⃣ Rendre les principaux statistiques dynamiques (4 stats) ; et respecter l'emploi du pluriel quand il y a plus de 1 pendant l'affichage :
- Vidéos régardées (ça devient "Médias consultés") : Voir la branche "media_views_count" dans le résultat API JSON de l'utilisateur en cours ;
- Médias lus : Voir la branche "media_plays_count" dans le résultat API JSON de l'utilisateur en cours ;
- Abonnements : API Endpoint "GET : https://admin.talaplus.tv/api/v1/subscription/user/{userId}/subscriptions" ("userId" sur l'URL est l'ID de l'utilisateur en cours). Compter juste le résultat ;
- Watchlist : API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}/watchlist" ("id" sur l'URL est l'ID de l'utilisateur en cours). Compter juste le résultat.

5️⃣ Il faut remplacer le lien "Historique" par "Produits/Services" qui affichera une fenêtre avec la liste des produits de l'utilisateur en cours. API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}/products" ("id" sur l'URL est l'ID de l'utilisateur en cours).

6️⃣ Il faut ajouter juste après le lient "Vidéos/Audios" qui affichera une fenêtre avec la liste des produits de l'utilisateur en cours. API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}/medias" ("id" sur l'URL est l'ID de l'utilisateur en cours).

7️⃣ Concernant les autres liens de "Profil" :
- "Watchlist" doit conduire à une fenêtre où l'on peut voir la liste des médias ajoutés par l'utilisateur en cours. API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}/watchlist" ("id" sur l'URL est l'ID de l'utilisateur en cours). Et juste après, il faut ajouter le lien "Panier" avec un badge qui montre le nombre d'articles dans le panier (ou rien quand le panier est vide). API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}/cart" ("id" sur l'URL est l'ID de l'utilisateur en cours).

- "Abonnements" doit conduire à la liste des personnes auxquelles l'utilisateur en cours s'est abonné. API Endpoint "GET : https://admin.talaplus.tv/api/v1/subscription/user/{userId}/subscriptions" ("userId" sur l'URL est l'ID de l'utilisateur en cours). Chaque bloc d'un utilisateur (partout dans l'appli, même sur le bloc de post, de média ou de produit/service) doit être affiché comme sur un réseau social et cliquable vers la fenêtre pour voir le profil (API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}"). Et sur cette fenêtre (profil de l'utilisateur autre que l'utilisateur en cours) qui ressemble à la fenêtre de profil de l'utilisateur en cours (Photo de profil, Noms, Badge, Membre depuis..., Statistiques), comme liens, il y aura juste le lien "Produits/Services" et "Vidéos/Audios".

- "Paiements" doit afficher un tableau de paiements de l'utilisateur en cours (Colonne à affiche : "reason", "entity" [A partir du nom de l'entité en base, tu peux mettre un mot en 3 langues comme suit :
    -> Si "entity" est "media" : "Vidéo/Audio",
    -> Si "entity" est "cart" : "Panier",
    -> Si "entity" est "user" : "Utilisateur",
    -> Si "entity" est "pricing" : "Tarification".
], entity-data [Cette colonne récupère les données d'une entité via "entity_id" :
    -> Si "entity" est "media" : "media_title",
    -> Si "entity" est "cart" : "payment_code",
    -> Si "entity" est "user" : "firstname" et "lastname",
    -> Si "entity" est "pricing" : "pricing_name".
]). API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{id}/payments".

- "Parrainage" doit afficher une fenêtre de la liste des personnes parrainées par l'utilisateur en cours. API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{userId}/referrees".
    -> Si l'utilisateur n'a jamais parrainé, il y aura, sur cette même fenêtre, le bouton "Devenir partenaire" (API Endpoint "POST : https://admin.talaplus.tv/api/v1/user/{userId}/become-referrer").
    -> Dès qu'il devient partenaire (La colonne "promo_code" et non vide), le bouton "Devenir partenaire" devient un bloc comme sur la fenêtre "Partenaire", c'est-à-dire :
        ->> "Ton code partenaire" avec le code dans la colonne "promo_code".
        ->> Le bouton "Parrainer" qui ouvre la possibilité (Le pop-up habituel pour partager sur les réseaux sociaux) de partager l'URL "https://talaplus.tv/referral?referral_code={promo_code}" (La valeur de "referral_code" est le code dans colonne "promo_code").

- "Paramètres" doit afficher une fenêtre contenant :
    ->  Un switch "Contenu chrétien uniquement" qui appelle l'endpoint API "PUT : https://admin.talaplus.tv/api/v1/user/{id}" avec, dans le BODY, la colonne "christian_preference (boolean)" de la table "users".
    -> Les sous-liens suivants :
        ->> "Données personnelles" pour afficher le formulaire de mise à jour des données personnelles. API Endpoint "PUT : https://admin.talaplus.tv/api/v1/user/{id}" avec, dans le BODY, les colonnes (Donne les libellés et les placeholders, en 3 langues, que l'utilisateur comprend, sur base des colonnes) :
            ->>> "firstname"
            ->>> "lastname"
            ->>> "surname"
            ->>> "about_me"
            ->>> "gender"
            ->>> "birthdate"
            ->>> "country"
            ->>> "city"
            ->>> "address_1"
            ->>> "address_2"
            ->>> "p_o_box"
            ->>> "currency (USD/CDF)"
            ->>> "email"
            ->>> "phone"
            ->>> "username"
        ->> "Changer mot de passe" pour modifier le mot de passe. API Endpoint "PATCH : https://admin.talaplus.tv/api/v1/user/{id}/password" avec, dans le BODY, les colonnes (Donne les libellés et les placeholders, en 3 langues, que l'utilisateur comprend, sur base des colonnes) :
            ->>> "former_password"
            ->>> "new_password"
            ->>> "password_confirmation"
    -> Les boutons suivants :
            ->>> Désactiver mon compte. API Endpoint "PATCH : https://admin.talaplus.tv/api/v1/user/{id}/status" avec comme donnée "status = 'disabled'".
            ->>> Supprimer mon compte. API Endpoint "PATCH : https://admin.talaplus.tv/api/v1/user/{id}/status" avec comme donnée "status = 'deleted'". Ce bouton affiche un pop-up avec :
                ->>>> Le texte, en 3 langues toujours, "Veuillez sauvegarder vos données avant de supprimer votre compte. Votre compte sera supprimé après 60 jours."
                ->>>> Le bouton "Supprimer maintenant"

8️⃣ Concernant la fenêtre qui apparait après clic sur le bloc "Espace partenaire" (Si l'utilisateur n'a jamais parrainé, ce bloc est invisible) il y a :
- "Ton code partenaire" avec le code dans la colonne "promo_code" ;
- Le bouton "Parrainer" qui ouvre la possibilité (Le pop-up habituel pour partager sur les réseaux sociaux) de partager l'URL "https://talaplus.tv/referral?referral_code={promo_code}" (La valeur de "referral_code" est le code dans colonne "promo_code") ;
- "Statistiques", il y a :
    -> "Inscriptions" :
        ->> Juste le nombre des filleuls de l'utilisateur en cours. Compter le résultat de l'API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{userId}/referrees" pour remplacer "256" par un nombre dynamique.
        ->> En tenant compte de la colonne "created_at" de chaque utilisateur (filleul de l'utilisateur en cours. spécifiquement pour les 7 derniers jours) et du nombre des jours depuis que l'utilisateur en cours a reçu le code partenaire (colonne "promo_code_at"), tu peux calculer le pourcentage de fréquence pour remplacer "+12%" par une valeur numérique dynamique ;
    -> "Abonnements" :
        ->> API Endpoint "GET : https://admin.talaplus.tv/api/v1/subscription/user/{userId}/subscriptions" ("userId" sur l'URL est l'ID de l'utilisateur en cours). Compter juste le résultat pour remplacer "98" par un nombre dynamique.
        ->> En tenant compte de la colonne "created_at" de chaque abonnement à l'utilisateur en cours (spécifiquement pour les 7 derniers jours), tu peux calculer le pourcentage de fréquence pour remplacer "+8%" par une valeur numérique dynamique ;
    -> "Revenus" :
        ->> API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{userId}/earning-stats" ("userId" sur l'URL est l'ID de l'utilisateur en cours. Et il faut récupérer la branche JSON "total_usd" principale [car il y en a plusieurs] pour remplacer "245,50" par une valeur venu de la base des données). Rendre les données en temps réel.
        ->> En tenant compte de la colonne "date" de la branche JSON "days" qui est incluse dans la branche JSON "weeks" de la branche "referral", tu peux calculer le pourcentage de fréquence pour remplacer "+16%" par une valeur numérique dynamique ;
    -> Le graphique "Évolution des revenus" : Ce graphique s'affiche selon l'API Endpoint "GET : https://admin.talaplus.tv/api/v1/user/{userId}/earning-stats" ("userId" sur l'URL est l'ID de l'utilisateur en cours. Et il faut récupérer la branche JSON "days" sous branche de "weeks ["end_date" doit être la plus récente]" qui est sous branche de "referral"). Et cette branche JSON "days" contient les jours qui serviront pour le graphique.


============
Toujours pour l'utilisateur en cours (onglet "Profil") :
============

Juste après le lien "Parrainage", mets le lien "Porte-monnaie" qui affiche une fenêtre contenant :
- le montant (monnaie virtuel) de l'utilisateur en cours. API Endpoint "GET : https://admin.talaplus.tv/api/v1/wallet/me" (ne pas oublier "Bearer [TOKEN]" pour identifier l'utilisateur en cours via son token) ;
- un bouton "Acheter des coins" qui ouvre une fenêtre avec la liste des packs (API Endpoint "GET : https://admin.talaplus.tv/api/v1/pricing/reason/coin_price"), à acheter pour recharger des coins ;

Sur la liste de chaque pack, il y a un bouton pour choisir le pack ; et, en cliquant sur ce bouton, il y a une fenêtre pour envoyer des données de paiement (API Endpoint "POST : https://admin.talaplus.tv/api/v1/wallet/coins/purchase") suivant :
- "pricing_id" : [L'ID du pack caché dans le bouton sur lequel l'utilisateur en cours clique pour choisir le pack]. Quand il clique un pop-up avec les libellés "Mode de paiement" et "Canal"
-> "type" : [Tu mettras le libellé "Mode de paiement" pour choisir :
    ->> entre "Mobile money" (tu envoies la valeur "1")
    ->> et "Carte bancaire" (tu envoies la valeur "2")]. Les images sont dans le dossiers "assets/payment" (Le nom des fichiers est "payment-[TYPE]" pour que tu associes le numéro du type au nom du mode de paiement) ;
    -> "channel" [Tu mettras le libellé "Canal" (corrige ce libellé aussi pour premium) pour choisir un canal]. Les canaux sont les suivants (Les images sont dans le dossier "assets/payment", et le nom des fichiers est "operator-[NOM DU CANAL]" pour que tu récupères le nom du canal pour mieux placer le nom et l'image) :
        ->> Afrimoney ;
        ->> Airtel money ;
        ->> M-Pesa ;
        ->> Orange money ;
        ->> Visa/Mastercard.
    -> "phone" [Tu mettras le libellé "N° de téléphone"]. Ce champs disparait quand l'utilisateur choisit "Carte bancaire" (qui enverra "type = 2" sur le serveur) et réapparait quand l'utilisateur choisit "Mobile money" (qui enverra "type = 1" sur le serveur).

En envoyant les données sur le serveur, pour type :
- Si l'utilisateur choisit "Mobile money" (valeur "1" envoyée pour "type"), tu le rédiriges vers une fenêtre contenant du contenu (centré au tout milieu) suivant :
    -> L'image "assets/payment/validate-payment.png" ;
    -> Un texte d'information "Validez le paiement sur votre téléphone et cliquez sur le bouton « OK » ci-dessous" (ne pas oublier que les textes sont en 3 languess ici et partout) ;
    -> Le fameux bouton « OK » sur lequel l'utilisateur clique après avoir validé le paiement "Mobile money" sur son téléphone.
- Si l'utilisateur choisit "Carte bancaire" (valeur "2" envoyée pour "type"), l'API doit retourner (s'il n'y a pas d'erreur) une réponse JSON contenant la branche "url" qui te servira pour rédiriger l'utilisateur vers une fenêtre contenant :
    -> Une flèche pour retourner à la fenêtre de "Porte-monnaie" qui contiendra maintenant une info (multilingue) "Dès que votre paiement est validé, le nombre de vos coins sera augmenté." ;
    -> Un webview (en dessous de la flèche retour) affichant le contenu venant de l'URL de cette branche JSON "url".

Dans les cas, que l'utilisateur clique sur « OK » pour "Mobile money", ou sur flèche pour retourner pour "Carte bancaire", il retourne toujours sur la fenêtre "Porte-monnaie".

============
Avant tout :
============
Pour ne pas tomber sur les erreurs JSON du genre "{en, fr, ln}", j'ai mis le fichier "assets/talaplus.sql" qui contient le schéma des données "talaplus" ; comme ça :
-> Dès que tu constates qu'une colonne d'une table est de type JSON, alors son résultat API aura la forme "{en, fr, ln}" ;
-> Tu peux renommer les valeurs des colonnes de type ENUM sur l'application (multilingue toujours) pour qu'elles s'affichent de manière lisible. Par exemple, pour le français, quand pour la colonne payments.reason  tu as :
    ->> "media_create" : Tu mets "Création vidéo/audio" ;
    ->> "media_boost" : Tu mets "Boost vidéo/audio" ;
    ->> "gift" : Tu mets "Cadeau" ;
    ->> "product_sale" : Tu mets "Vente produit/service" ;
    ->> etc.

============
On peut donc continuer :
============

1️⃣ Sur le profil de l'utilisateur en cours, au lien "Paiement" :
- pour la colonne "motif" du tableau sur la page, tu peux mettre des mots compréhensible pour l'utilisateur ("coin_price" peut devenir "Prix de coins". N'oublie pas le multilingue) ;
- ajoute la colonne "Etat" pour definir l'état du paiement : (0) Ré
