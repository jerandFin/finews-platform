// Original practice questions based on standard financial and economic concepts.
function practice(question, correctAnswer, distractors) {
    return { question, correctAnswer, options: [correctAnswer, ...distractors] };
}

module.exports = {
    easy: [
        practice("Which investment represents an ownership stake in a company?",
            "A share of common stock", ["A corporate bond", "A bank certificate of deposit", "A Treasury bill"]),
        practice("If prices rise by 5% while your cash balance stays the same, what happens to your purchasing power?",
            "It falls", ["It rises by 5%", "It stays the same", "It rises only if you hold cash for a year"]),
        practice("What does diversification help reduce?",
            "The impact of any one investment doing poorly", ["The need to pay investment fees", "The chance that interest rates change", "The time it takes to sell any asset"]),
        practice("What does it mean to earn compound interest?",
            "You earn interest on the principal and previously earned interest", ["You earn interest only on the original principal", "You earn the same amount each year regardless of your balance", "Your interest rate increases automatically each month"]),
        practice("What does the coupon on a conventional bond represent?",
            "The interest payment specified by the bond", ["The bond’s current market price", "The fee charged for trading it", "The profit guaranteed if you sell it early"]),
        practice("What happens to the amount you pay if a retailer gives you a 10% discount on a $100 item?",
            "It falls to $90 before tax", ["It falls to $95 before tax", "It falls to $99 before tax", "It stays at $100 before tax"]),
        practice("What is the opportunity cost of spending your savings on a trip?",
            "The value of the best alternative use of that money", ["The dollar amount shown on every travel receipt", "The value of all possible alternatives combined", "The credit limit on the card used to pay"]),
        practice("Which asset is generally easiest to use immediately to pay a grocery bill?",
            "Money in a checking account", ["Home equity", "A painting", "A five-year certificate of deposit before maturity"]),
        practice("What is a cash dividend on common stock?",
            "A cash payment declared by the company for its shareholders", ["A refund of all trading fees", "A percentage of the company’s outstanding debt", "A guaranteed increase in the stock price"])
    ],
    medium: [
        practice("Holding other factors constant, how can higher policy rates slow inflation?",
            "By making borrowing costlier and cooling spending", ["By directly capping every company’s prices", "By increasing the purchasing power of all borrowers immediately", "By raising the face value of existing fixed-rate bonds"]),
        practice("What usually happens to the price of an existing fixed-rate bond when yields on comparable bonds rise?",
            "It falls", ["It rises", "It stays at face value until maturity", "It rises by the same number of percentage points"]),
        practice("Why can an unexpected disruption to oil supplies raise inflation while slowing output?",
            "It can raise production costs while constraining supply", ["It always raises consumer purchasing power", "It lets energy-intensive firms produce more at lower cost", "It reduces the price of imported energy in every currency"]),
        practice("What does it mean for a yield curve to invert between two maturities?",
            "The shorter-maturity yield is higher than the longer-maturity yield", ["Both yields fall below zero", "The longer bond’s market price is below face value", "Both maturities have the same yield"]),
        practice("When one country’s currency appreciates, what tends to happen to import prices in that currency, all else equal?",
            "They fall", ["They rise", "They become fixed by the exchange", "They rise only when the import was already expensive"]),
        practice("Which measure adjusts nominal GDP for changes in prices?",
            "Real GDP", ["Nominal GDP per capita", "The unemployment rate", "The trade balance"]),
        practice("What does a widening corporate credit spread over comparable government bonds imply?",
            "Investors are demanding more yield relative to government bonds", ["Corporate borrowers are paying less relative to government borrowers", "The corporate coupon rate must have changed", "Government and corporate bonds now carry the same risk"]),
        practice("Why might a central bank buy longer-term securities during quantitative easing?",
            "To put downward pressure on longer-term yields and ease financial conditions", ["To set a statutory minimum yield on new corporate bonds", "To transfer all government debt to private banks", "To raise borrowing costs by reducing demand for bonds"]),
        practice("What is the approximate real return if a deposit earns 4% and inflation is 2% over the same period?",
            "2%", ["6%", "4%", "8%"])
    ],
    hard: [
        practice("A $1 million bond position has a modified duration of 6. Ignoring convexity, what is its approximate value change when yields rise 50 basis points?",
            "A loss of $30,000", ["A gain of $30,000", "A loss of $5,000", "A loss of $60,000"]),
        practice("A bank has $120 million of eligible high-quality liquid assets and $100 million of 30-day net cash outflows. What is its liquidity coverage ratio?",
            "120%", ["83.3%", "20%", "220%"]),
        practice("A lender advances $95 against $100 of collateral. If the haircut rises to 10% and the collateral value is unchanged, how much borrowing does that collateral now support?",
            "$90", ["$95", "$85", "$110"]),
        practice("A bank has $12 million of common equity tier 1 capital and $150 million of risk-weighted assets. What is its CET1 ratio?",
            "8%", ["12.5%", "12%", "18%"]),
        practice("A trading desk holds $40 million in bonds funded by $36 million of debt. The asset value falls 5% and debt is unchanged. By what percentage does the desk’s equity fall?",
            "50%", ["5%", "10%", "20%"]),
        practice("A bank expects $90 million in withdrawals tomorrow, has $55 million of unencumbered cash, and can borrow $20 million overnight. With no other flows, what funding gap remains?",
            "$15 million", ["$35 million", "$55 million", "$75 million"]),
        practice("An FX move increases the domestic-currency value of an unhedged foreign debt from $100 million to $112 million. With asset values unchanged, what is the immediate effect on equity?",
            "It falls by $12 million", ["It rises by $12 million", "It falls by $112 million", "It stays unchanged until the debt matures"]),
        practice("A bank has $10 million of unsecured exposure to a defaulting counterparty and expects to recover 40%. What is the expected loss on that exposure?",
            "$6 million", ["$4 million", "$10 million", "$14 million"]),
        practice("A loan portfolio has a $50 million exposure at default, a 2% probability of default, and 40% loss given default. What is its expected loss under these assumptions?",
            "$400,000", ["$1 million", "$2 million", "$20 million"])
    ]
};
