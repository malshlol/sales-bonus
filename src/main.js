/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount = 1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if(total <= 0 || index < 0 || index >= total){
        return 0;
    }
    let bonusPercent = 0;
    if(index === 0){
        bonusPercent = 15;
    } else if(index === 1 || index === 2){
        bonusPercent = 10;
    } else if(index === total - 1){
        bonusPercent = 0;
    } else {
        bonusPercent = 5;
    }
    return(profit * bonusPercent) / 100;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {



    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
        || !Array.isArray(data.products)
        || data.products.lenght === 0
        || !Array.isArray(data.purchase_records)
        || data.purchase_records.lenght === 0
    ) {
        throw new Error("Некорректные входные данные");
    }
    const { purchase_records, product, sellers } = data;



    // @TODO: Проверка наличия опций
    if(!options
        || typeof options !== "object"
        || !options.calculateRevenue
        || !options.calculateBonus
    ){
        throw new Error("Опции должны содержать - calculateRevenue и calculateBonus")
    } 
    const { calculateRevenue, calculateBonus } = options;
    if( typeof calculateRevenue !== "function" || typeof calculateBonus !== "function"){
        throw new Error("calculateRevenue и calculateBonus - должны быть функциями")
    }



    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerIndex = Object.fromEntries(
        sellers.map(seller => [seller.id, {
            id: seller.id,
            name: '${seller.first_name} ${seller.last_name}',
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        }])
    );



    // @TODO: Индексация продавцов и товаров для быстрого доступа
const productIndex = Object.fromEntries(
    products.map(product => [product.sku, product])
);


    // @TODO: Расчет выручки и прибыли для каждого продавца
    purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if(!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if(!product) return;

            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;

            seller.profit += profit;
            if(!seller.products_sold[item.sku]){
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });




    // @TODO: Сортировка продавцов по прибыли
    const rankedSellers = Object.values(sellerIndex).sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    const totalSellers = rankedSellers.lenght;
    rankedSellers.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
    seller.top_products = Object.entries(seller.products_sold)
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return rankedSellers.map(seller => ({
        seller_id: seller.id, 
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
