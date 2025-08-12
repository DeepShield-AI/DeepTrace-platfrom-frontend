import React from "react";
import {
    scaleLinear,
    schemeOrRd,
    color as d3color,
    select as d3select
} from "d3";

const transitionTime = "250ms";
const transitionCurve = "cubic-bezier(0.85, 0.69, 0.71, 1.32)";

const widthTransition = `width ${transitionTime} ${transitionCurve}`;
const transformTransition = `transform ${transitionTime} ${transitionCurve}`;
const RowHeight = 20;

class FlameRect extends React.Component {
    state = {
        hideLabel: false,
        color: schemeOrRd[9][Math.floor(Math.random() * 9)]
    };

    rectRef = React.createRef();
    labelRef = React.createRef();
    gRef = React.createRef();

    onClick = () => this.props.onSelect();

    // 确保在DOM更新后检查标签状态
    checkLabelVisibility = () => {
        // 使用requestAnimationFrame确保获取最新的DOM尺寸
        requestAnimationFrame(() => {
            if (!this.labelRef.current) return;

            // 获取元素实际渲染的宽度（考虑过渡动画后的最终状态）
            const rectWidth = this.props.width;
            // 获取文本实际宽度
            const labelWidth = this.labelRef.current.getComputedTextLength();

            // 同时处理显示和隐藏两种情况
            if (labelWidth > rectWidth - 10) { // 预留10px边距
                this.setState({ hideLabel: true });
            } else {
                this.setState({ hideLabel: false });
            }
        });
    };

    componentDidUpdate(prevProps) {
        const { x, y } = this.props;
        d3select(this.gRef.current).attr("transform", `translate(${x}, ${y})`);

        // 任何可能影响宽度的属性变化都需要检查标签
        if (
            prevProps.width !== this.props.width ||
            prevProps.selected !== this.props.selected
        ) {
            this.checkLabelVisibility();
        }
    }

    componentDidMount() {
        this.checkLabelVisibility();
    }

    // 简化shouldComponentUpdate，确保必要时能更新
    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextState.hideLabel !== this.state.hideLabel ||
            nextProps.width !== this.props.width ||
            nextProps.x !== this.props.x ||
            nextProps.y !== this.props.y ||
            nextProps.selected !== this.props.selected
        );
    }

    render() {
        const { y, height, name, selected, width, x } = this.props;
        const { hideLabel, color } = this.state;
        let fillColor = color;

        if (selected) {
            fillColor = d3color(fillColor).brighter(0.5);
        }

        return (
            <g
                ref={this.gRef}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: "pointer", transition: transformTransition }}
                onClick={this.onClick}
            >
                <rect
                    ref={this.rectRef}
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    style={{
                        transition: widthTransition,
                        stroke: "white",
                        strokeWidth: 1,
                        fill: fillColor
                    }}
                />
                {/* 即使隐藏也保留元素（用于计算宽度），但设置visibility */}
                <text
                    ref={this.labelRef}
                    x={5}
                    y={13}
                    style={{
                        fontSize: "12px",
                        fill: "#333",
                        pointerEvents: "none",
                        visibility: hideLabel ? "hidden" : "visible"
                    }}
                >
                    {name}
                </text>
            </g>
        );
    }
}

class Flamegraph extends React.Component {
    state = {
        selectedChild: null,
        // 深拷贝数据并保存原始值
        data: this.props.data.map(d => ({ ...d, _origValue: d.value }))
    };

    // 处理选中状态切换
    handleSelect = (index) => {
        if (!this.props.enableClick) return;

        this.setState(prevState => {
            const isSameChild = prevState.selectedChild === index;
            
            return {
                selectedChild: isSameChild ? null : index,
                data: prevState.data.map((d, i) => {
                    // 始终使用初始保存的原始值进行计算，避免累积误差
                    const origValue = d._origValue;
                    return {
                        ...d,
                        value: isSameChild 
                            ? origValue  // 取消选中时恢复原始值
                            : i === index ? origValue : origValue * 0.1
                    };
                })
            };
        });
    };

    render() {
        const { x = 0, y = 0, width, level = 0, enableClick } = this.props;
        const { data, selectedChild } = this.state;

        // 计算总宽度用于比例尺
        const totalValue = data.reduce((sum, d) => sum + d.value, 0);
        const xScale = scaleLinear()
            .domain([0, totalValue])
            .range([0, width]);

        return (
            <g transform={`translate(${x}, ${y})`}>
                {data.map((d, i) => {
                    // 计算当前元素的起始位置
                    const startX = data
                        .slice(0, i)
                        .reduce((sum, item) => sum + item.value, 0);

                    return (
                        <React.Fragment key={`flame-${level}-${i}-${d.name}`}>
                            <FlameRect
                                x={xScale(startX)}
                                y={0}
                                width={xScale(d.value)}
                                height={RowHeight}
                                name={d.name}
                                onSelect={() => this.handleSelect(i)}
                                selected={selectedChild === i}
                            />
                            {/* 递归渲染子元素 */}
                            {d.children && (
                                <Flamegraph
                                    data={d.children}
                                    x={xScale(startX)}
                                    y={RowHeight}
                                    width={xScale(d.value)}
                                    level={level + 1}
                                    enableClick={enableClick}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </g>
        );
    }
}

export default Flamegraph;