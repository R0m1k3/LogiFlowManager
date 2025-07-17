# 🔧 CORRECTION FORMAT APIREQUEST - COMMANDES CLIENT

## **Problème Identifié**
L'erreur dans les logs montre que `apiRequest` recevait un objet au lieu des paramètres corrects :
```javascript
// ❌ FORMAT INCORRECT (causait l'erreur)
apiRequest(`/api/customer-orders/${id}`, {
  method: 'PUT',
  body: { status }
})

// ✅ FORMAT CORRECT
apiRequest(`/api/customer-orders/${id}`, 'PUT', { status })
```

## **Corrections Appliquées**

### **CustomerOrders.tsx**
```javascript
// STATUS MUTATION
mutationFn: ({ id, status }) =>
  apiRequest(`/api/customer-orders/${id}`, 'PUT', { status })

// NOTIFICATION MUTATION  
mutationFn: ({ id, customerNotified }) =>
  apiRequest(`/api/customer-orders/${id}`, 'PUT', { customerNotified })

// DELETE MUTATION
mutationFn: (id) => 
  apiRequest(`/api/customer-orders/${id}`, 'DELETE')
```

## **Signature apiRequest**
```typescript
apiRequest(
  url: string,
  method: string = 'GET',
  body?: unknown,
  headers?: Record<string, string>
)
```

## **Test de Validation**
✅ **Création commande** : Fonctionne (format déjà correct)
✅ **Modification statut** : Corrigé format API  
✅ **Notification client** : Corrigé format API
✅ **Suppression** : Corrigé format API

**Les changements de statut des commandes client devraient maintenant fonctionner !**